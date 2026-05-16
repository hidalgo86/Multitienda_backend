No guardes claves JWT reales en git. Genera claves nuevas por entorno y
cargalas como secrets o variables de entorno.

Ejemplo con OpenSSL:
openssl genrsa -out private.key 2048
openssl rsa -in private.key -pubout -out public.key

Variables soportadas:
JWT_PRIVATE_KEY_PATH=/ruta/segura/private.key
JWT_PUBLIC_KEY_PATH=/ruta/segura/public.key

JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n..."

JWT_PRIVATE_KEY_BASE64=...
JWT_PUBLIC_KEY_BASE64=...

En Windows:
& "C:\Program Files\OpenSSL-Win64\bin\openssl.exe" genrsa -out private.key 2048
& "C:\Program Files\OpenSSL-Win64\bin\openssl.exe" rsa -pubout -in private.key -out public.key
