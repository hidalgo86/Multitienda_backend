import { Field, InputType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class VerifyEmailInput {
  @Field(() => String)
  @IsNotEmpty({ message: 'El ID del usuario es obligatorio' })
  @IsMongoId({ message: 'El ID del usuario debe ser un ID válido de MongoDB' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : String(value ?? ''),
  )
  userId: string;

  @Field(() => String)
  @IsNotEmpty({ message: 'El código de verificación es obligatorio' })
  @IsString({
    message: 'El código de verificación debe ser una cadena de texto',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : String(value ?? ''),
  )
  code: string;
}
