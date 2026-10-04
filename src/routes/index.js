import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { analyticsLimiter, loginLimiter, orderLimiter } from '../middleware/rateLimiter.js';
import { uploadImage } from '../middleware/upload.js';
import * as auth from '../controllers/auth.controller.js';
import * as settings from '../controllers/settings.controller.js';
import * as categories from '../controllers/category.controller.js';
import * as products from '../controllers/product.controller.js';
import * as orders from '../controllers/order.controller.js';
import * as analytics from '../controllers/analytics.controller.js';
import * as banners from '../controllers/banner.controller.js';
import * as home from '../controllers/home.controller.js';
import {
  analyticsRules,
  availabilityRules,
  bannerRules,
  categoryRules,
  idParam,
  loginRules,
  orderRules,
  paymentRules,
  productRules,
  settingsRules,
  statusRules,
} from '../validators/rules.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, service: 'deepam-crackers-api' });
});

router.get('/settings', settings.publicSettings);
router.get('/home', home.getHome);
router.get('/categories', categories.getCategories);
router.get('/products', products.getProducts);
router.get('/products/category/:categoryId', products.getProductsByCategory);
router.get('/products/:slug', products.getProduct);
router.post('/orders', orderLimiter, validate(orderRules), orders.postOrder);
router.post('/orders/:id/whatsapp', orderLimiter, validate(idParam), orders.postWhatsapp);
router.post('/analytics/events', analyticsLimiter, validate(analyticsRules), analytics.postEvent);

const admin = Router();
admin.use(requireAdmin);

admin.get('/auth/me', auth.me);
admin.get('/dashboard', analytics.dashboard);
admin.get('/analytics', analytics.dashboard);
admin.get('/settings', settings.adminSettings);
admin.put('/settings', validate(settingsRules), settings.saveSettings);

admin.get('/categories', categories.getAdminCategories);
admin.post('/categories', validate(categoryRules), categories.postCategory);
admin.put('/categories/:id', validate(idParam), validate(categoryRules), categories.putCategory);
admin.delete('/categories/:id', validate(idParam), categories.removeCategory);
admin.post('/categories/:id/image', validate(idParam), uploadImage, categories.uploadCategoryImage);

admin.get('/banners', banners.getAdminBanners);
admin.post('/banners', validate(bannerRules), banners.postBanner);
admin.put('/banners/:id', validate(idParam), validate(bannerRules), banners.putBanner);
admin.delete('/banners/:id', validate(idParam), banners.removeBanner);
admin.post('/banners/:id/image', validate(idParam), uploadImage, banners.uploadBannerImage);

admin.get('/products', products.getAdminProducts);
admin.get('/products/:id', validate(idParam), products.getAdminProduct);
admin.post('/products', validate(productRules), products.postProduct);
admin.put('/products/:id', validate(idParam), validate(productRules), products.putProduct);
admin.patch('/products/:id/availability', validate(idParam), validate(availabilityRules), products.patchAvailability);
admin.delete('/products/:id', validate(idParam), products.removeProduct);
admin.post('/products/:id/image', validate(idParam), uploadImage, products.uploadProductImage);

admin.get('/orders', orders.getOrders);
admin.get('/orders/:id', validate(idParam), orders.getOneOrder);
admin.patch('/orders/:id/status', validate(statusRules), orders.patchStatus);
admin.patch('/orders/:id/payment', validate(paymentRules), orders.patchPayment);

router.post('/admin/auth/login', loginLimiter, validate(loginRules), auth.login);
router.use('/admin', admin);

export default router;
