/**
 * Auth Components
 * 
 * Export all authentication-related components and hooks.
 */

export {
  ProtectedRoute,
  PlayerRoute,
  CoachRoute,
  HSCoachRoute,
  JUCOCoachRoute,
  CollegeCoachRoute,
  ShowcaseCoachRoute,
  AnyCoachRoute,
  AdminRoute,
  useProtectedRoute,
  type UserRole,
  type CoachRole,
  type AuthErrorReason,
  type ProtectedRouteProps,
} from './ProtectedRoute';

export {
  RoleBasedRedirect,
  useRoleBasedRedirect,
  type RoleBasedRedirectProps,
  type UserType,
  type CoachType,
} from './RoleBasedRedirect';
