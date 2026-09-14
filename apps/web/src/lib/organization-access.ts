import { prisma } from './prisma';

export async function evaluateOrganizationAccess(organizationId:string){
  const now=new Date();
  const subscription=await prisma.subscription.findFirst({where:{organizationId},orderBy:{createdAt:'desc'},include:{license:true,plan:true}});
  const active=Boolean(subscription&&subscription.status==='ACTIVE'&&subscription.expiresAt&&subscription.expiresAt>now&&subscription.license?.status==='ACTIVE'&&subscription.license.expiresAt>now);
  if(!active){
    await prisma.$transaction(async tx=>{
      await tx.organization.updateMany({where:{id:organizationId,status:'ACTIVE'},data:{status:'SUBSCRIPTION_INACTIVE'}});
      if(subscription){
        await tx.subscription.updateMany({where:{id:subscription.id,status:'ACTIVE'},data:{status:'EXPIRED'}});
        if(subscription.license)await tx.license.updateMany({where:{id:subscription.license.id,status:'ACTIVE'},data:{status:'EXPIRED'}});
      }
    });
  }else{
    await prisma.organization.updateMany({where:{id:organizationId,status:'SUBSCRIPTION_INACTIVE'},data:{status:'ACTIVE'}});
  }
  return {active,subscription};
}
