import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function saveCart(shopifyId, cartVariantIds) {
	const savedCart = JSON.stringify(cartVariantIds);
	return prisma.customer.upsert({
		where: { shopifyId },
		update: { savedCart },
		create: { shopifyId, savedCart }
	});
}

export async function handleSaveForLater(shopifyId, cartVariantIds) {
	return saveCart(shopifyId, cartVariantIds);
}

async function getSavedCart(shopifyId) { 
	return prisma.customer.findUniqueOrThrow({
		where: { shopifyId }
	});
}

export async function handleGetSavedCart(shopifyId) {
	return getSavedCart(shopifyId);
}