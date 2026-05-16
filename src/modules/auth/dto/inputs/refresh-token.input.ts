import { Field, InputType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class RefreshTokenInput {
  @Field(() => String)
  @IsNotEmpty({ message: 'El refresh token es obligatorio' })
  @IsString({ message: 'El refresh token debe ser una cadena de texto' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : String(value ?? ''),
  )
  refresh_token: string;
}
