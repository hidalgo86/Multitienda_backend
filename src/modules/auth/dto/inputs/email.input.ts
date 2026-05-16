import { Field, InputType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty } from 'class-validator';

@InputType()
export class EmailInput {
  @Field(() => String)
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  @IsEmail({}, { message: 'El correo electrónico debe ser válido' })
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.toLowerCase().trim()
      : String(value ?? ''),
  )
  email: string;
}
