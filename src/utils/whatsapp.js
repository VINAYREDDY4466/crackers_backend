export function buildWhatsappMessage(order) {
  const lines = order.items.map((item) => `- ${item.productName} × ${item.quantity}`);
  const notes = order.customer.notes ? `\nNotes: ${order.customer.notes}` : '';

  return [
    'Hello, I would like to place an order.',
    '',
    `Order ID: ${order.orderNumber}`,
    '',
    'Products:',
    ...lines,
    '',
    `Total: ₹${order.totalAmount.toLocaleString('en-IN')}`,
    '',
    `Name: ${order.customer.name}`,
    `Phone: ${order.customer.phone}`,
    `Address: ${order.customer.address}${notes}`,
  ].join('\n');
}

export function buildWhatsappUrl(phoneNumber, message) {
  const digits = String(phoneNumber || '').replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
