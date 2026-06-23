const { hashPassword, comparePassword } = require('../src/auth');

test('密码哈希不应等于明文，且正确密码可以通过校验', async () => {
  const hash = await hashPassword('123456');
  expect(hash).not.toBe('123456');
  expect(await comparePassword('123456', hash)).toBe(true);
  expect(await comparePassword('wrong', hash)).toBe(false);
});
