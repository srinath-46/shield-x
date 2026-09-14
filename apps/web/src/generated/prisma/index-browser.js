
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.OrganizationScalarFieldEnum = {
  id: 'id',
  name: 'name',
  companyName: 'companyName',
  industry: 'industry',
  country: 'country',
  primarySite: 'primarySite',
  email: 'email',
  phone: 'phone',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  firebaseUid: 'firebaseUid',
  organizationId: 'organizationId',
  siteId: 'siteId',
  zoneId: 'zoneId',
  supervisorId: 'supervisorId',
  name: 'name',
  email: 'email',
  phone: 'phone',
  role: 'role',
  status: 'status',
  workerCode: 'workerCode',
  shift: 'shift',
  helmetStatus: 'helmetStatus',
  vestStatus: 'vestStatus',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SiteScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  name: 'name',
  location: 'location',
  description: 'description',
  active: 'active',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ZoneScalarFieldEnum = {
  id: 'id',
  siteId: 'siteId',
  name: 'name',
  description: 'description',
  active: 'active',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PlanScalarFieldEnum = {
  id: 'id',
  name: 'name',
  pricePaise: 'pricePaise',
  billingMonths: 'billingMonths',
  maxSupervisors: 'maxSupervisors',
  maxWorkers: 'maxWorkers',
  maxSites: 'maxSites',
  features: 'features',
  active: 'active',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PaymentScalarFieldEnum = {
  id: 'id',
  razorpayOrderId: 'razorpayOrderId',
  razorpayPaymentId: 'razorpayPaymentId',
  amountPaise: 'amountPaise',
  currency: 'currency',
  gateway: 'gateway',
  status: 'status',
  payload: 'payload',
  paidAt: 'paidAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SubscriptionScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  planId: 'planId',
  paymentId: 'paymentId',
  status: 'status',
  startsAt: 'startsAt',
  expiresAt: 'expiresAt',
  createdAt: 'createdAt'
};

exports.Prisma.LicenseScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  subscriptionId: 'subscriptionId',
  key: 'key',
  signedPayload: 'signedPayload',
  signature: 'signature',
  publicKey: 'publicKey',
  status: 'status',
  issuedAt: 'issuedAt',
  expiresAt: 'expiresAt'
};

exports.Prisma.InvitationScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  invitedById: 'invitedById',
  email: 'email',
  name: 'name',
  phone: 'phone',
  workerCode: 'workerCode',
  role: 'role',
  siteId: 'siteId',
  zoneId: 'zoneId',
  shift: 'shift',
  supervisorId: 'supervisorId',
  acceptedUserId: 'acceptedUserId',
  tokenHash: 'tokenHash',
  status: 'status',
  expiresAt: 'expiresAt',
  acceptedAt: 'acceptedAt',
  createdAt: 'createdAt'
};

exports.Prisma.AuditLogScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  actorId: 'actorId',
  action: 'action',
  entityType: 'entityType',
  entityId: 'entityId',
  metadata: 'metadata',
  createdAt: 'createdAt'
};

exports.Prisma.AttendanceScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  userId: 'userId',
  siteId: 'siteId',
  date: 'date',
  status: 'status',
  checkIn: 'checkIn',
  checkOut: 'checkOut',
  recordedById: 'recordedById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AlertScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  siteId: 'siteId',
  zoneId: 'zoneId',
  userId: 'userId',
  type: 'type',
  title: 'title',
  message: 'message',
  severity: 'severity',
  status: 'status',
  occurredAt: 'occurredAt',
  resolvedAt: 'resolvedAt'
};

exports.Prisma.MonitoringEventScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  siteId: 'siteId',
  zoneId: 'zoneId',
  workerId: 'workerId',
  helmetStatus: 'helmetStatus',
  vestStatus: 'vestStatus',
  source: 'source',
  recordedAt: 'recordedAt',
  metadata: 'metadata'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.OrganizationStatus = exports.$Enums.OrganizationStatus = {
  ACTIVE: 'ACTIVE',
  SUBSCRIPTION_INACTIVE: 'SUBSCRIPTION_INACTIVE',
  SUSPENDED: 'SUSPENDED'
};

exports.Role = exports.$Enums.Role = {
  ADMIN: 'ADMIN',
  SUPERVISOR: 'SUPERVISOR',
  WORKER: 'WORKER'
};

exports.AccountStatus = exports.$Enums.AccountStatus = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED'
};

exports.PaymentStatus = exports.$Enums.PaymentStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED'
};

exports.SubscriptionStatus = exports.$Enums.SubscriptionStatus = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED'
};

exports.LicenseStatus = exports.$Enums.LicenseStatus = {
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  REVOKED: 'REVOKED'
};

exports.InvitationStatus = exports.$Enums.InvitationStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  EXPIRED: 'EXPIRED',
  REVOKED: 'REVOKED'
};

exports.AttendanceStatus = exports.$Enums.AttendanceStatus = {
  PRESENT: 'PRESENT',
  ABSENT: 'ABSENT',
  LATE: 'LATE',
  ON_LEAVE: 'ON_LEAVE'
};

exports.AlertSeverity = exports.$Enums.AlertSeverity = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL'
};

exports.AlertStatus = exports.$Enums.AlertStatus = {
  ACTIVE: 'ACTIVE',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
  RESOLVED: 'RESOLVED'
};

exports.Prisma.ModelName = {
  Organization: 'Organization',
  User: 'User',
  Site: 'Site',
  Zone: 'Zone',
  Plan: 'Plan',
  Payment: 'Payment',
  Subscription: 'Subscription',
  License: 'License',
  Invitation: 'Invitation',
  AuditLog: 'AuditLog',
  Attendance: 'Attendance',
  Alert: 'Alert',
  MonitoringEvent: 'MonitoringEvent'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
