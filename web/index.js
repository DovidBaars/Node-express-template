import { join } from 'path';
import { readFileSync } from 'fs';
import express from 'express';
import serveStatic from 'serve-static';

import shopify from './shopify.js';
import webhooks from './webhooks.js';
import { handleSaveForLater, handleGetSavedCart } from './cart.js';

const PORT = parseInt(process.env.BACKEND_PORT || process.env.PORT, 10);
const HTTP_CREATED = 201;
const HTTP_OK = 200;
const HTTP_INTERNAL_SERVER_ERROR = 500;
const HTTP_INVALID_REQUEST = 400;
const HTTP_NOT_FOUND = 404;

const STATIC_PATH =
	process.env.NODE_ENV === 'production'
		? `${process.cwd()}/frontend/dist`
		: `${process.cwd()}/frontend/`;

const app = express();

// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
	shopify.config.auth.callbackPath,
	shopify.auth.callback(),
	shopify.redirectToShopifyOrAppRoot()
);
app.post(
	shopify.config.webhooks.path,
	// @ts-ignore
	shopify.processWebhooks({ webhookHandlers: webhooks })
);

app.post('/api/cart-save', express.json(), async (req, res) => {
	try {
		const {customerId: shopifyId, products: cartVariantIds} = req.body;
		if (!shopifyId || !cartVariantIds) {
			return res.status(HTTP_INVALID_REQUEST).send();
		}
		await handleSaveForLater(shopifyId, cartVariantIds);
		return res.status(HTTP_CREATED).send();
	} catch (error) {
		return res.status(HTTP_INTERNAL_SERVER_ERROR).send();
	}
});

app.get('/api/cart-load', async (req, res) => {
	try {
		const customerId = req.query.logged_in_customer_id;
		if (!customerId) {
			return res.status(HTTP_INVALID_REQUEST).send();
		}
		const cart = await handleGetSavedCart(customerId);
		return res.status(HTTP_OK).set('Content-Type', 'application/json').json(cart.savedCart);
	} catch (error) { 
		if (error.code === 'P2025') { 
			return res.status(HTTP_NOT_FOUND).send('No Customer found');
		} else {
			return res.status(HTTP_INTERNAL_SERVER_ERROR).send('Internal server error');
		}
	}
});

// All endpoints after this point will require an active session
app.use('/api/*', shopify.validateAuthenticatedSession());

app.use(express.json());

app.use(serveStatic(STATIC_PATH, { index: false }));

app.use('/*', shopify.ensureInstalledOnShop(), async (_req, res) => {
	return res.set('Content-Type', 'text/html').send(readFileSync(join(STATIC_PATH, 'index.html')));
});

app.listen(PORT);

