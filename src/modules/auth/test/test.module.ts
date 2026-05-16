import { Test, TestingModule } from '@nestjs/testing';
import { MockMailService } from '@/common/email/mock-mail.service';
import { EmailService } from '@/common/email/email.service';
import { AppModule } from '@/app.module';
import { UsersModule } from '@/modules/users/users.module';

export const testImports = [
  AppModule,
  UsersModule,
  // Agrega otros módulos si es necesario
];

export const testProviders = [
  { provide: EmailService, useClass: MockMailService },
  MockMailService,
  // Puedes agregar más mocks aquí
];

export async function createTestModule(): Promise<TestingModule> {
  const moduleBuilder = Test.createTestingModule({
    imports: testImports,
    providers: testProviders,
  });

  // Sobrescribe el provider para asegurar el uso del mock
  const moduleFixture = await moduleBuilder
    .overrideProvider(EmailService)
    .useClass(MockMailService)
    .compile();

  return moduleFixture;
}
