import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { listBanners } from './banner.service.js';
import { presentProduct } from './product.service.js';

const POPULAR_SIZE = 6;
const SECTION_SIZE = 5;

function presentCategoryTile(category, productCount) {
  return {
    id: category._id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    imageUrl: category.imageUrl,
    productCount,
  };
}

export async function getHomeData() {
  const categories = await Category.find({ isActive: true }).sort({ displayOrder: 1, name: 1 });
  const categoryIds = categories.map((category) => category._id);

  const [banners, popular, groups] = await Promise.all([
    listBanners(),
    Product.find({
      isActive: true,
      categoryId: { $in: categoryIds },
      discountPercentage: { $gt: 0 },
      stockStatus: { $ne: 'out_of_stock' },
    })
      .populate('categoryId', 'name slug')
      .sort({ discountPercentage: -1, createdAt: -1 })
      .limit(POPULAR_SIZE),
    Product.aggregate([
      { $match: { isActive: true, categoryId: { $in: categoryIds } } },
      // Alphabetical order puts in_stock, then low_stock, then out_of_stock.
      { $sort: { stockStatus: 1, discountPercentage: -1, createdAt: -1 } },
      { $group: { _id: '$categoryId', productIds: { $push: '$_id' }, count: { $sum: 1 } } },
      { $project: { count: 1, productIds: { $slice: ['$productIds', SECTION_SIZE] } } },
    ]),
  ]);

  const sectionProducts = await Product.find({ _id: { $in: groups.flatMap((group) => group.productIds) } })
    .populate('categoryId', 'name slug');
  const productsById = new Map(sectionProducts.map((product) => [String(product._id), presentProduct(product)]));
  const groupsByCategory = new Map(groups.map((group) => [String(group._id), group]));

  const sections = [];
  const tiles = categories.map((category) => {
    const group = groupsByCategory.get(String(category._id));
    const tile = presentCategoryTile(category, group?.count || 0);
    if (group) {
      sections.push({
        category: tile,
        products: group.productIds.map((id) => productsById.get(String(id))).filter(Boolean),
      });
    }
    return tile;
  });

  return {
    banners,
    categories: tiles,
    popular: popular.map(presentProduct),
    sections,
  };
}
