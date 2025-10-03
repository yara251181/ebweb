import secrets
print('JWT_SECRET_KEY=' + secrets.token_hex(32))