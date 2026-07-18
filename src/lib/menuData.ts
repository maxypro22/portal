/**
 * Steak Town's real menu — extracted from steaktown.qa/menu/?category=...
 * Powers the "What are you in the mood for today?" multi-select browser in
 * the booking wizard. Images are downloaded locally into public/menu/<category>/
 * (not hot-linked) so they don't depend on the live site staying up.
 */

export type MenuItem = { name: string; image: string };
export type MenuCategory = { key: string; label: string; items: MenuItem[] };

export const MENU_CATEGORIES: MenuCategory[] = [
  {
    key: "hot-stone-steaks",
    label: "Hot Stone Steaks",
    items: [
      { name: "Ribeye Hot Stone", image: "/menu/hot-stone-steaks/ribeye-hot-stone.webp" },
      { name: "Tenderloin Hot Stone", image: "/menu/hot-stone-steaks/tenderloin-hot-stone.webp" },
      { name: "Striploin Hot Stone", image: "/menu/hot-stone-steaks/striploin-hot-stone.webp" },
    ],
  },
  {
    key: "chef-signature-dishes",
    label: "Chef Signature Dishes",
    items: [
      { name: "Brisket 130g", image: "/menu/chef-signature-dishes/brisket-130g.webp" },
      { name: "Chicken Milanese", image: "/menu/chef-signature-dishes/chicken-milanese.webp" },
      { name: "Sizzling Beef Mushroom", image: "/menu/chef-signature-dishes/sizzling-beef-mushroom.webp" },
      { name: "Striploin 200g", image: "/menu/chef-signature-dishes/striploin-200g.webp" },
      { name: "Ribeye 300g", image: "/menu/chef-signature-dishes/ribeye-300g.webp" },
      { name: "Surf & Turf", image: "/menu/chef-signature-dishes/surf-turf.webp" },
      { name: "Beef Skewers", image: "/menu/chef-signature-dishes/beef-skewers.webp" },
      { name: "NY Steak – Striploin – 200g", image: "/menu/chef-signature-dishes/ny-steak-striploin-200g.webp" },
      { name: "Tenderloin 150g", image: "/menu/chef-signature-dishes/tenderloin-150g.webp" },
    ],
  },
  {
    key: "burgers-and-sandwiches",
    label: "Burgers and Sandwiches",
    items: [
      { name: "Sizzling Cheese Burger", image: "/menu/burgers-and-sandwiches/sizzling-cheese-burger.webp" },
      { name: "Pulled Ribs", image: "/menu/burgers-and-sandwiches/pulled-ribs.webp" },
      { name: "Town Burger – Wagyu", image: "/menu/burgers-and-sandwiches/town-burger-wagyu.webp" },
      { name: "Brisket Quesadilla", image: "/menu/burgers-and-sandwiches/brisket-quesadilla.webp" },
      { name: "Little Spice", image: "/menu/burgers-and-sandwiches/little-spice.webp" },
      { name: "Classic Bacon Burger", image: "/menu/burgers-and-sandwiches/classic-bacon-burger.webp" },
    ],
  },
  {
    key: "special-meats-for-sharing",
    label: "Special Meats For Sharing",
    items: [
      { name: "Tomahawk", image: "/menu/special-meats-for-sharing/tomahawk.webp" },
      { name: "500g Back Ribs with Corn Bread", image: "/menu/special-meats-for-sharing/500g-back-ribs-cornbread.webp" },
      { name: "T-Bone 425 Grams", image: "/menu/special-meats-for-sharing/t-bone-425g.webp" },
    ],
  },
  {
    key: "starters",
    label: "Starters",
    items: [
      { name: "Buffalo Wings", image: "/menu/starters/buffalo-wings.webp" },
      { name: "Brisket Croquette", image: "/menu/starters/brisket-croquette.webp" },
      { name: "Meat Empanada", image: "/menu/starters/meat-empanada.webp" },
      { name: "Beef Chillie", image: "/menu/starters/beef-chillie.webp" },
      { name: "Cauliflower Tempura", image: "/menu/starters/cauliflower-tempura.webp" },
      { name: "Jalapeno Poppers", image: "/menu/starters/jalapeno-poppers.webp" },
    ],
  },
  {
    key: "soup",
    label: "Soup",
    items: [
      { name: "Pumpkin Cappuccino Soup", image: "/menu/soup/pumpkin-cappuccino-soup.webp" },
      { name: "Cauliflower Soup", image: "/menu/soup/cauliflower-soup.webp" },
      { name: "Smoked Tomato Soup", image: "/menu/soup/smoked-tomato-soup.webp" },
    ],
  },
  {
    key: "salads",
    label: "Salads",
    items: [
      { name: "Town Salad", image: "/menu/salads/town-salad.webp" },
      { name: "Crispy Beef Salad", image: "/menu/salads/crispy-beef-salad.webp" },
      { name: "Green Red", image: "/menu/salads/green-red.webp" },
    ],
  },
  {
    key: "desserts",
    label: "Desserts",
    items: [
      { name: "Lemon Cake", image: "/menu/desserts/lemon-cake.webp" },
      { name: "Chocolate Garden", image: "/menu/desserts/chocolate-garden.webp" },
      { name: "Barbecued Pineapple", image: "/menu/desserts/barbecued-pineapple.webp" },
      { name: "Date Cake", image: "/menu/desserts/date-cake.webp" },
    ],
  },
  {
    key: "side-dishes-sauces",
    label: "Side Dishes & Sauces",
    items: [
      { name: "Grilled Shredded Corn", image: "/menu/side-dishes-sauces/grilled-shredded-corn.webp" },
      { name: "Ratatouille – Roasted Vegetables", image: "/menu/side-dishes-sauces/ratatouille-roasted-vegetables.webp" },
      { name: "Grilled Asparagus", image: "/menu/side-dishes-sauces/grilled-asparagus.webp" },
      { name: "Aligot – Mushed Potato with Cheese", image: "/menu/side-dishes-sauces/aligot-mushed-potato-cheese.webp" },
      { name: "Garlic Cheese Bread", image: "/menu/side-dishes-sauces/garlic-cheese-bread.webp" },
      { name: "Vinaigrette", image: "/menu/side-dishes-sauces/vinaigrette.webp" },
      { name: "Blue Cheese", image: "/menu/side-dishes-sauces/blue-cheese.webp" },
      { name: "Rustic Sweet Potato", image: "/menu/side-dishes-sauces/rustic-sweet-potato.webp" },
      { name: "French Fries", image: "/menu/side-dishes-sauces/french-fries.webp" },
      { name: "Mushed Green Peas", image: "/menu/side-dishes-sauces/mushed-green-peas.webp" },
      { name: "Bernaise", image: "/menu/side-dishes-sauces/bernaise.webp" },
      { name: "Chimichurri", image: "/menu/side-dishes-sauces/chimichurri.webp" },
      { name: "BBQ", image: "/menu/side-dishes-sauces/bbq.webp" },
      { name: "Tare", image: "/menu/side-dishes-sauces/tare.webp" },
    ],
  },
  {
    key: "kids-menu",
    label: "Kids Menu",
    items: [
      { name: "Kids Burger", image: "/menu/kids-menu/kids-burger.webp" },
      { name: "Linguini Bolognese", image: "/menu/kids-menu/linguini-bolognese.webp" },
    ],
  },
  {
    key: "hot-drinks",
    label: "Hot Drinks",
    items: [
      { name: "Assorted Tea", image: "/menu/hot-drinks/assorted-tea.webp" },
      { name: "Americano", image: "/menu/hot-drinks/americano.webp" },
      { name: "Turkish Coffee", image: "/menu/hot-drinks/turkish-coffee.webp" },
      { name: "Cappuccino", image: "/menu/hot-drinks/cappuccino.webp" },
      { name: "Coffee Latte", image: "/menu/hot-drinks/coffee-latte.webp" },
      { name: "Espresso Cafe", image: "/menu/hot-drinks/espresso-cafe.webp" },
    ],
  },
  {
    key: "drinks",
    label: "Drinks",
    items: [
      { name: "Sparkling Natural Mineral Water 330ml", image: "/menu/drinks/sparkling-mineral-water-330ml.webp" },
      { name: "Sparkling Natural Mineral Water 750ml", image: "/menu/drinks/sparkling-mineral-water-750ml.webp" },
      { name: "Red Bull Mojito", image: "/menu/drinks/red-bull-mojito.webp" },
      { name: "Soft Drinks Kinza", image: "/menu/drinks/soft-drinks-kinza.webp" },
      { name: "Lemon with Mint", image: "/menu/drinks/lemon-with-mint.webp" },
      { name: "Piña Colada", image: "/menu/drinks/pina-colada.webp" },
      { name: "Strawberry Breeze", image: "/menu/drinks/strawberry-breeze.webp" },
      { name: "Strawberry Mojito", image: "/menu/drinks/strawberry-mojito.webp" },
      { name: "Red Bull", image: "/menu/drinks/red-bull.webp" },
      { name: "Mango Juice", image: "/menu/drinks/mango-juice.webp" },
      { name: "Orange Juice", image: "/menu/drinks/orange-juice.webp" },
      { name: "Strawberry Juice", image: "/menu/drinks/strawberry-juice.webp" },
      { name: "Natural Mineral Water 500ml", image: "/menu/drinks/mineral-water-500ml.webp" },
      { name: "Emily", image: "/menu/drinks/emily.webp" },
      { name: "Passion Fruit Mojito", image: "/menu/drinks/passion-fruit-mojito.webp" },
      { name: "Natural Mineral Water 1000ml", image: "/menu/drinks/mineral-water-1000ml.webp" },
      { name: "Pineapple Juice", image: "/menu/drinks/pineapple-juice.webp" },
      { name: "Classic Mojito", image: "/menu/drinks/classic-mojito.webp" },
      { name: "Blue Lagoon", image: "/menu/drinks/blue-lagoon.webp" },
    ],
  },
  {
    key: "offers-and-promotion",
    label: "Offers and Promotion",
    items: [
      { name: "Hot & Loaded Offer", image: "/menu/offers-and-promotion/hot-loaded-offer.webp" },
      { name: "Choose 2 of 3 for 75QR (Hot Stone Promotion)", image: "/menu/offers-and-promotion/hot-stone-promotion.webp" },
    ],
  },
  {
    key: "new-flavored-dishes",
    label: "New Flavored Dishes",
    items: [], // empty on the live menu too ("No products here yet")
  },
];

/** A menu item as selected in the booking wizard — `key` (categoryKey::name)
 *  uniquely identifies it for toggling/removal and React lists. */
export type SelectedMenuItem = MenuItem & { key: string; categoryLabel: string };

/** Look up a menu item (with its category, image, and composite key) by
 *  exact name — used to re-hydrate thumbnails from the comma-joined
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
