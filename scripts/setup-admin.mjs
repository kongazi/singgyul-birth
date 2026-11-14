import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
const file = '.env.local';
let content = existsSync(file) ? readFileSync(file,'utf8') : '';
for (const key of ['ADMIN_PASSWORD','ADMIN_SESSION_SECRET']) {
  if (!new RegExp(`^${key}=.+$`,'m').test(content)) content += `\n${key}=${randomBytes(32).toString('base64url')}\n`;
}
writeFileSync(file,content,{mode:0o600});
console.log('관리자 설정을 .env.local에 저장했습니다. ADMIN_PASSWORD 값을 확인해 로그인하세요. 비밀번호는 출력하지 않습니다.');
