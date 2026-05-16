import { Field, InputType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { IsMongoId, IsNotEmpty } from 'class-validator';

@InputType()
export class ResendVerificationInput {
  @Field(() => String)
  @IsNotEmpty({ message: 'El ID del usuario es obligatorio' })
  @IsMongoId({ message: 'El ID del usuario debe ser un ID válido de MongoDB' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : String(value ?? ''),
  )
  userId: string;
}
