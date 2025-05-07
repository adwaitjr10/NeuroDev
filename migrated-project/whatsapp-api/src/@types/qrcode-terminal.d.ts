Filename: whatsapp-api/src/@types/qrcode-terminal.d.ts

/* eslint-disable import/prefer-default-export */
declare module 'qrcode-terminal' {
  export function generate(text: string, { small: boolean }): void;
}