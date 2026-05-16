export class Resend {
  emails = {
    send: () =>
      Promise.resolve({ data: { id: 'test-message-id' }, error: null }),
  };
}
