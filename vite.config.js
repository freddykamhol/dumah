import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        shop: 'index.html',
        information: 'checkout/index.html',
        shipping: 'checkout/shipping.html',
        payment: 'checkout/payment.html',
      },
    },
  },
})
