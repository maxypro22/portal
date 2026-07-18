/**
 * Steak Town's real menu — extracted from steaktown.qa/menu/?category=...
 * Powers the "What are you in the mood for today?" multi-select browser in
 * the booking wizard. Images are downloaded locally into public/menu/<category>/
 * (not hot-linked) so they don't depend on the live site staying up.
 */

export type MenuItem = { name: string; image: string; price: string };
export type MenuCategory = { key: string; label: string; items: MenuItem[] };

export const MENU_CATEGORIES: MenuCategory[] = [
  {
    key: "hot-stone-steaks",
    label: "Hot Stone Steaks",
    items: [
      { name: "Ribeye Hot Stone", image: "/menu/hot-stone-steaks/ribeye-hot-stone.webp", price: "QAR 250" },
      { name: "Tenderloin Hot Stone", image: "/menu/hot-stone-steaks/tenderloin-hot-stone.webp", price: "QAR 89" },
      { name: "Striploin Hot Stone", image: "/menu/hot-stone-steaks/striploin-hot-stone.webp", price: "QAR 69" },
    ],
  },
  {
    key: "chef-signature-dishes",
    label: "Chef Signature Dishes",
    items: [
      { name: "Brisket 130g", image: "/menu/chef-signature-dishes/brisket-130g.webp", price: "QAR 88" },
      { name: "Chicken Milanese", image: "/menu/chef-signature-dishes/chicken-milanese.webp", price: "QAR 45" },
      { name: "Sizzling Beef Mushroom", image: "/menu/chef-signature-dishes/sizzling-beef-mushroom.webp", price: "QAR 45" },
      { name: "Striploin 200g", image: "/menu/chef-signature-dishes/striploin-200g.webp", price: "QAR 69" },
      { name: "Ribeye 300g", image: "/menu/chef-signature-dishes/ribeye-300g.webp", price: "QAR 250" },
      { name: "Surf & Turf", image: "/menu/chef-signature-dishes/surf-turf.webp", price: "QAR 115" },
      { name: "Beef Skewers", image: "/menu/chef-signature-dishes/beef-skewers.webp", price: "QAR 45" },
      { name: "NY Steak – Striploin – 200g", image: "/menu/chef-signature-dishes/ny-steak-striploin-200g.webp", price: "QAR 98" },
      { name: "Tenderloin 150g", image: "/menu/chef-signature-dishes/tenderloin-150g.webp", price: "QAR 120" },
    ],
  },
  {
    key: "burgers-and-sandwiches",
    label: "Burgers and Sandwiches",
    items: [
      { name: "Sizzling Cheese Burger", image: "/menu/burgers-and-sandwiches/sizzling-cheese-burger.webp", price: "QAR 45" },
      { name: "Pulled Ribs", image: "/menu/burgers-and-sandwiches/pulled-ribs.webp", price: "QAR 80" },
      { name: "Town Burger – Wagyu", image: "/menu/burgers-and-sandwiches/town-burger-wagyu.webp", price: "QAR 70" },
      { name: "Brisket Quesadilla", image: "/menu/burgers-and-sandwiches/brisket-quesadilla.webp", price: "QAR 65" },
      { name: "Little Spice", image: "/menu/burgers-and-sandwiches/little-spice.webp", price: "QAR 65" },
      { name: "Classic Bacon Burger", image: "/menu/burgers-and-sandwiches/classic-bacon-burger.webp", price: "QAR 65" },
    ],
  },
  {
    key: "special-meats-for-sharing",
    label: "Special Meats For Sharing",
    items: [
      { name: "Tomahawk", image: "/menu/special-meats-for-sharing/tomahawk.webp", price: "QAR 450" },
      { name: "500g Back Ribs with Corn Bread", image: "/menu/special-meats-for-sharing/500g-back-ribs-cornbread.webp", price: "QAR 300" },
      { name: "T-Bone 425 Grams", image: "/menu/special-meats-for-sharing/t-bone-425g.webp", price: "QAR 200" },
    ],
  },
  {
    key: "starters",
    label: "Starters",
    items: [
      { name: "Buffalo Wings", image: "/menu/starters/buffalo-wings.webp", price: "QAR 45" },
      { name: "Brisket Croquette", image: "/menu/starters/brisket-croquette.webp", price: "QAR 45" },
      { name: "Meat Empanada", image: "/menu/starters/meat-empanada.webp", price: "QAR 30" },
      { name: "Beef Chillie", image: "/menu/starters/beef-chillie.webp", price: "QAR 45" },
      { name: "Cauliflower Tempura", image: "/menu/starters/cauliflower-tempura.webp", price: "QAR 30" },
      { name: "Jalapeno Poppers", image: "/menu/starters/jalapeno-poppers.webp", price: "QAR 30" },
    ],
  },
  {
    key: "soup",
    label: "Soup",
    items: [
      { name: "Pumpkin Cappuccino Soup", image: "/menu/soup/pumpkin-cappuccino-soup.webp", price: "QAR 35" },
      { name: "Cauliflower Soup", image: "/menu/soup/cauliflower-soup.webp", price: "QAR 35" },
      { name: "Smoked Tomato Soup", image: "/menu/soup/smoked-tomato-soup.webp", price: "QAR 35" },
    ],
  },
  {
    key: "salads",
    label: "Salads",
    items: [
      { name: "Town Salad", image: "/menu/salads/town-salad.webp", price: "QAR 45" },
      { name: "Crispy Beef Salad", image: "/menu/salads/crispy-beef-salad.webp", price: "QAR 35" },
      { name: "Green Red", image: "/menu/salads/green-red.webp", price: "QAR 45" },
    ],
  },
  {
    key: "desserts",
    label: "Desserts",
    items: [
      { name: "Lemon Cake", image: "/menu/desserts/lemon-cake.webp", price: "QAR 40" },
      { name: "Chocolate Garden", image: "/menu/desserts/chocolate-garden.webp", price: "QAR 40" },
      { name: "Barbecued Pineapple", image: "/menu/desserts/barbecued-pineapple.webp", price: "QAR 30" },
      { name: "Date Cake", image: "/menu/desserts/date-cake.webp", price: "QAR 65" },
    ],
  },
  {
    key: "side-dishes-sauces",
    label: "Side Dishes & Sauces",
    items: [
      { name: "Grilled Shredded Corn", image: "/menu/side-dishes-sauces/grilled-shredded-corn.webp", price: "QAR 30" },
      { name: "Ratatouille – Roasted Vegetables", image: "/menu/side-dishes-sauces/ratatouille-roasted-vegetables.webp", price: "QAR 30" },
      { name: "Grilled Asparagus", image: "/menu/side-dishes-sauces/grilled-asparagus.webp", price: "QAR 30" },
      { name: "Aligot – Mushed Potato with Cheese", image: "/menu/side-dishes-sauces/aligot-mushed-potato-cheese.webp", price: "QAR 30" },
      { name: "Garlic Cheese Bread", image: "/menu/side-dishes-sauces/garlic-cheese-bread.webp", price: "QAR 30" },
      { name: "Vinaigrette", image: "/menu/side-dishes-sauces/vinaigrette.webp", price: "QAR 10" },
      { name: "Blue Cheese", image: "/menu/side-dishes-sauces/blue-cheese.webp", price: "QAR 10" },
      { name: "Rustic Sweet Potato", image: "/menu/side-dishes-sauces/rustic-sweet-potato.webp", price: "QAR 30" },
      { name: "French Fries", image: "/menu/side-dishes-sauces/french-fries.webp", price: "QAR 15" },
      { name: "Mushed Green Peas", image: "/menu/side-dishes-sauces/mushed-green-peas.webp", price: "QAR 30" },
      { name: "Bernaise", image: "/menu/side-dishes-sauces/bernaise.webp", price: "QAR 10" },
      { name: "Chimichurri", image: "/menu/side-dishes-sauces/chimichurri.webp", price: "QAR 10" },
      { name: "BBQ", image: "/menu/side-dishes-sauces/bbq.webp", price: "QAR 10" },
      { name: "Tare", image: "/menu/side-dishes-sauces/tare.webp", price: "QAR 10" },
    ],
  },
  {
    key: "kids-menu",
    label: "Kids Menu",
    items: [
      { name: "Kids Burger", image: "/menu/kids-menu/kids-burger.webp", price: "QAR 35" },
      { name: "Linguini Bolognese", image: "/menu/kids-menu/linguini-bolognese.webp", price: "QAR 30" },
    ],
  },
  {
    key: "hot-drinks",
    label: "Hot Drinks",
    items: [
      { name: "Assorted Tea", image: "/menu/hot-drinks/assorted-tea.webp", price: "QAR 15" },
      { name: "Americano", image: "/menu/hot-drinks/americano.webp", price: "QAR 10" },
      { name: "Turkish Coffee", image: "/menu/hot-drinks/turkish-coffee.webp", price: "QAR 15" },
      { name: "Cappuccino", image: "/menu/hot-drinks/cappuccino.webp", price: "QAR 15" },
      { name: "Coffee Latte", image: "/menu/hot-drinks/coffee-latte.webp", price: "QAR 15" },
      { name: "Espresso Cafe", image: "/menu/hot-drinks/espresso-cafe.webp", price: "QAR 10" },
    ],
  },
  {
    key: "drinks",
    label: "Drinks",
    items: [
      { name: "Sparkling Natural Mineral Water 330ml", image: "/menu/drinks/sparkling-mineral-water-330ml.webp", price: "QAR 12" },
      { name: "Sparkling Natural Mineral Water 750ml", image: "/menu/drinks/sparkling-mineral-water-750ml.webp", price: "QAR 24" },
      { name: "Red Bull Mojito", image: "/menu/drinks/red-bull-mojito.webp", price: "QAR 30" },
      { name: "Soft Drinks Kinza", image: "/menu/drinks/soft-drinks-kinza.webp", price: "QAR 10" },
      { name: "Lemon with Mint", image: "/menu/drinks/lemon-with-mint.webp", price: "QAR 25" },
      { name: "Piña Colada", image: "/menu/drinks/pina-colada.webp", price: "QAR 30" },
      { name: "Strawberry Breeze", image: "/menu/drinks/strawberry-breeze.webp", price: "QAR 30" },
      { name: "Strawberry Mojito", image: "/menu/drinks/strawberry-mojito.webp", price: "QAR 30" },
      { name: "Red Bull", image: "/menu/drinks/red-bull.webp", price: "QAR 25" },
      { name: "Mango Juice", image: "/menu/drinks/mango-juice.webp", price: "QAR 25" },
      { name: "Orange Juice", image: "/menu/drinks/orange-juice.webp", price: "QAR 25" },
      { name: "Strawberry Juice", image: "/menu/drinks/strawberry-juice.webp", price: "QAR 25" },
      { name: "Natural Mineral Water 500ml", image: "/menu/drinks/mineral-water-500ml.webp", price: "QAR 12" },
      { name: "Emily", image: "/menu/drinks/emily.webp", price: "QAR 30" },
      { name: "Passion Fruit Mojito", image: "/menu/drinks/passion-fruit-mojito.webp", price: "QAR 30" },
      { name: "Natural Mineral Water 1000ml", image: "/menu/drinks/mineral-water-1000ml.webp", price: "QAR 24" },
      { name: "Pineapple Juice", image: "/menu/drinks/pineapple-juice.webp", price: "QAR 40" },
      { name: "Classic Mojito", image: "/menu/drinks/classic-mojito.webp", price: "QAR 25" },
      { name: "Blue Lagoon", image: "/menu/drinks/blue-lagoon.webp", price: "QAR 30" },
    ],
  },
  {
    key: "offers-and-promotion",
    label: "Offers and Promotion",
    items: [
      { name: "Hot & Loaded Offer", image: "/menu/offers-and-promotion/hot-loaded-offer.webp", price: "QAR 75" },
      { name: "Choose 2 of 3 for 75QR (Hot Stone Promotion)", image: "/menu/offers-and-promotion/hot-stone-promotion.webp", price: "QAR 75" },
    ],
  },
];

/** A menu item as selected in the booking wizard — `key` (categoryKey::name)
 *  uniquely identifies it for toggling/removal and React lists. */
export type SelectedMenuItem = MenuItem & { key: string; categoryLabel: string };

/** Look up a menu item (with its category, image, price, and composite key)
 *  by exact name — used to re-hydrate thumbnails from the comma-joined
 *  specialRequests string. */
export function findMenuItem(name: string): SelectedMenuItem | undefined {
  for (const cat of MENU_CATEGORIES) {
    const item = cat.items.find((i) => i.name === name);
    if (item) return { ...item, key: `${cat.key}::${item.name}`, categoryLabel: cat.label };
  }
  return undefined;
}

/** Parse the comma-joined specialRequests string back into matched menu items. */
export function parseSelectedMoodItems(specialRequests: string | null | undefined): SelectedMenuItem[] {
  if (!specialRequests) return [];
  return specialRequests
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map(findMenuItem)
    .filter((i): i is SelectedMenuItem => !!i);
}
