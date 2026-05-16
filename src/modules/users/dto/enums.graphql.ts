import { registerEnumType } from '@nestjs/graphql';
import { UserRole, UserStatus } from '../schemas/users.schema';

// Registra los enums de Mongo para GraphQL (SOLO UNA VEZ)
registerEnumType(UserStatus, { name: 'UserStatus' });
registerEnumType(UserRole, { name: 'UserRole' });
