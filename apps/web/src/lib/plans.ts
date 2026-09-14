import { prisma } from './prisma';

export const defaultPlans={
  basic:{name:'Foundation',pricePaise:499900,billingMonths:12,maxSupervisors:2,maxWorkers:20,maxSites:1,features:['Signed digital license','Supervisor desktop access','Worker mobile access','Secure invitations','Audit history']},
  professional:{name:'Operations',pricePaise:1299900,billingMonths:12,maxSupervisors:10,maxWorkers:100,maxSites:5,features:['Everything in Foundation','Advanced monitoring','Reports','Notifications','Multi-site controls']},
  enterprise:{name:'Enterprise',pricePaise:2999900,billingMonths:12,maxSupervisors:50,maxWorkers:500,maxSites:25,features:['Everything in Operations','Advanced management','Custom deployment','Dedicated support','High-capacity access']},
} as const;

export type PlanId=keyof typeof defaultPlans;
export async function ensurePlans(){await Promise.all(Object.entries(defaultPlans).map(([id,plan])=>prisma.plan.upsert({where:{id},update:{active:true},create:{id,...plan,features:[...plan.features]}})));return prisma.plan.findMany({where:{active:true},orderBy:{pricePaise:'asc'}})}
export async function getActivePlan(id:PlanId){await ensurePlans();const plan=await prisma.plan.findFirst({where:{id,active:true}});if(!plan)throw new Error('Selected plan is unavailable');return plan}
