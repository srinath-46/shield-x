import { createHmac } from 'crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { adminAuth } from '@/lib/firebase-admin';
import { createLicense } from '@/lib/license';
import { sendMail } from '@/lib/mail';

const schema=z.object({razorpay_payment_id:z.string(),razorpay_order_id:z.string(),razorpay_signature:z.string(),orderId:z.string(),planId:z.enum(['basic','professional','enterprise']),orgName:z.string().min(2),companyName:z.string().min(2),industry:z.string().min(2),country:z.string().min(2),primarySite:z.string().min(2),adminName:z.string().min(2),adminEmail:z.string().email(),adminPhone:z.string().min(7),password:z.string().min(10)});

export async function POST(req:Request){
  let firebaseUid:string|undefined;
  try{
    const data=schema.parse(await req.json());
    if(data.orderId!==data.razorpay_order_id)throw new Error('Order mismatch');
    const expected=createHmac('sha256',process.env.RAZORPAY_KEY_SECRET!).update(`${data.razorpay_order_id}|${data.razorpay_payment_id}`).digest('hex');
    if(expected!==data.razorpay_signature)throw new Error('Invalid payment signature');
    const payment=await prisma.payment.findUniqueOrThrow({where:{razorpayOrderId:data.orderId}});
    if(payment.amountPaise!==(await prisma.plan.findUniqueOrThrow({where:{id:data.planId}})).pricePaise)throw new Error('Payment amount does not match the selected plan');
    const completed=await prisma.subscription.findUnique({where:{paymentId:payment.id},include:{license:true}});
    if(completed?.license)return NextResponse.json({licenseKey:completed.license.key});
    if(payment.razorpayPaymentId&&payment.razorpayPaymentId!==data.razorpay_payment_id)throw new Error('Payment identifier mismatch');
    const fb=await adminAuth.createUser({email:data.adminEmail,password:data.password,displayName:data.adminName,emailVerified:false});firebaseUid=fb.uid;
    const now=new Date(),expiresAt=new Date();expiresAt.setFullYear(expiresAt.getFullYear()+1);
    const result=await prisma.$transaction(async tx=>{
      const org=await tx.organization.create({data:{name:data.orgName,companyName:data.companyName,industry:data.industry,country:data.country,primarySite:data.primarySite,email:data.adminEmail,phone:data.adminPhone}});
      const site=await tx.site.create({data:{organizationId:org.id,name:data.primarySite,location:data.country,description:'Primary site'}});
      const admin=await tx.user.create({data:{firebaseUid:fb.uid,organizationId:org.id,siteId:site.id,name:data.adminName,email:data.adminEmail,phone:data.adminPhone,role:'ADMIN',status:'ACTIVE'}});
      await tx.payment.update({where:{id:payment.id},data:{status:'PAID',razorpayPaymentId:data.razorpay_payment_id,paidAt:payment.paidAt??now,payload:{verifiedAt:now.toISOString(),source:'CHECKOUT_SIGNATURE'}}});
      const subscription=await tx.subscription.create({data:{organizationId:org.id,planId:data.planId,paymentId:payment.id,status:'ACTIVE',startsAt:now,expiresAt}});
      const signed=createLicense({organizationId:org.id,subscriptionId:subscription.id,planId:subscription.planId,issuedAt:now.toISOString(),expiresAt:expiresAt.toISOString()});
      const license=await tx.license.create({data:{organizationId:org.id,subscriptionId:subscription.id,key:signed.key,signedPayload:signed.payload,signature:signed.signature,publicKey:signed.publicKey,expiresAt}});
      await tx.auditLog.create({data:{organizationId:org.id,actorId:admin.id,action:'ORGANIZATION_ACTIVATED',entityType:'LICENSE',entityId:license.id,metadata:{paymentId:data.razorpay_payment_id}}});
      return license;
    });
    await sendMail(data.adminEmail,'Your Shield X license is active',`<h1>Shield X activated</h1><p>Your verified organization license is:</p><p><strong>${result.key}</strong></p><p>Valid until ${expiresAt.toLocaleDateString('en-IN')}.</p>`).catch(error=>console.error('License email delivery failed',error));
    return NextResponse.json({licenseKey:result.key});
  }catch(e){if(firebaseUid)await adminAuth.deleteUser(firebaseUid).catch(()=>{});console.error(e);return NextResponse.json({error:e instanceof Error?e.message:'Payment verification failed.'},{status:400})}
}
