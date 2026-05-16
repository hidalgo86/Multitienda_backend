import { Field, InputType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

@InputType()
export class ResetPasswordInput {
  @Field(() => String)
  @IsNotEmpty({ message: 'El username es obligatorio' })
  @IsString({ message: 'El username debe ser una cadena de texto' })
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.trim().toLowerCase()
      : String(value ?? ''),
  )
  username: string;

  @Field(() => String)
  @IsNotEmpty({ message: 'El nuevo password es obligatorio' })
  @IsString({ message: 'El nuevo password debe ser una cadena de texto' })
  @MinLength(6, {
    message: 'El nuevo password debe tener al menos 6 caracteres',
  })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
    {
      message:
        'El nuevo password debe contener al menos una letra minuscula, una mayuscula, un numero y un caracter especial [@$!%*?&]',
    },
  )
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : String(value ?? ''),
  )
  newPassword: string;

  @Field(() => String)
  @IsNotEmpty({ message: 'El token es obligatorio' })
  @IsString({ message: 'El token debe ser una cadena de texto' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : String(value ?? ''),
  )
  token: string;
}
