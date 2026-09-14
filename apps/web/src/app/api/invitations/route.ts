import { createHash,randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendMail } from '@/lib/mail';

const input=z.object({name:z.string().min(2),email:z.string().email(),phone:z.string().min(7),siteId:z.string().uuid(),zoneId:z.string().uuid().optional().or(z.literal('')),workerCode:z.string().optional(),shift:z.string().optional()});

export async function POST(req:Request){
  try{
    const data=input.parse(await req.json());
    const {user,subscription}=await requireRole('ADMIN','SUPERVISOR');
    const role=user.role==='ADMIN'?'SUPERVISOR':'WORKER';
    if(role==='WORKER'&&!data.workerCode)throw new Error('Worker code is required');
    const site=await prisma.site.findFirst({where:{id:data.siteId,organizationId:user.organizationId,active:true,...(user.role==='SUPERVISOR'?{users:{some:{id:user.id}}}:{})}});
    if(!site)throw new Error('Site does not belong to your organization');
    const zone=data.zoneId?await prisma.zone.findFirst({where:{id:data.zoneId,siteId:site.id,active:true}}):null;
    if(data.zoneId&&!zone)throw new Error('Zone does not belong to the assigned site');
    const existingAccount=await prisma.user.findUnique({where:{email:data.email.toLowerCase()}});
    if(existingAccount){
      if(user.role==='ADMIN'&&existingAccount.organizationId===user.organizationId&&existingAccount.role==='SUPERVISOR')throw new Error('This supervisor already has an account. To assign them to a different site, open Admin → Supervisors and select Change site.');
      if(user.role==='SUPERVISOR'&&existingAccount.organizationId===user.organizationId&&existingAccount.role==='WORKER')throw new Error('This worker already has an account. Update the existing worker assignment instead of sending another invitation.');
      throw new Error('An account already exists for this email. Each email can have only one Shield X account.');
    }
    if(await prisma.invitation.findFirst({where:{email:data.email.toLowerCase(),status:'PENDING',expiresAt:{gt:new Date()}}}))throw new Error('An active invitation already exists for this email');
    const count=await prisma.user.count({where:{organizationId:user.organizationId,role}});
    const limit=role==='SUPERVISOR'?subscription.plan.maxSupervisors:subscription.plan.maxWorkers;
    if(count>=limit)throw new Error(`${role.toLowerCase()} plan limit reached`);
    const raw=randomBytes(32).toString('base64url');
    const tokenHash=createHash('sha256').update(raw).digest('hex');
    const invitation=await prisma.invitation.create({data:{organizationId:user.organizationId,invitedById:user.id,email:data.email.toLowerCase(),name:data.name,phone:data.phone,workerCode:role==='WORKER'?data.workerCode:undefined,role,siteId:site.id,zoneId:role==='WORKER'&&zone?zone.id:undefined,shift:role==='WORKER'?data.shift:undefined,supervisorId:role==='WORKER'?user.id:undefined,tokenHash,expiresAt:new Date(Date.now()+7*86400000)}});
    await prisma.auditLog.create({data:{organizationId:user.organizationId,actorId:user.id,action:`${role}_INVITED`,entityType:'INVITATION',entityId:invitation.id}});
    const base=process.env.NEXT_PUBLIC_APP_URL??new URL(req.url).origin;
    const activationUrl=`${base}/activate?token=${encodeURIComponent(raw)}`;
    let emailDelivered=true;
    const appName=role==='SUPERVISOR'?'Shield X Supervisor Desktop':'Shield X Mobile';
    try{await sendMail(data.email,`Activate your Shield X ${role.toLowerCase()} account`,`<h1>You have been invited to Shield X</h1><p>${user.name} invited you as a ${role.toLowerCase()} at ${site.name}.</p><p><a href="${activationUrl}">Accept invitation</a></p><p>This secure, single-use link expires in 7 days. After activation, sign in to access ${appName} instructions.</p>`)}catch(error){emailDelivered=false;console.error('Invitation email failed',error);if(process.env.NODE_ENV==='production'){await prisma.invitation.update({where:{id:invitation.id},data:{status:'REVOKED'}});throw new Error('Invitation email could not be delivered')}}
    return NextResponse.json({ok:true,emailDelivered,activationUrl:process.env.NODE_ENV==='production'?undefined:activationUrl});
  }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Could not create invitation'},{status:400})}
}
