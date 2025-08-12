const app = document.getElementById("app");

function el(tag, attrs={}, children=[]) {
  const n = document.createElement(tag);
  for (const [k,v] of Object.entries(attrs)) n.setAttribute(k, v);
  for (const c of [].concat(children)) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  return n;
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function Home(){
  await sleep(500);
  const wrap = el("section");
  const hero = el("div", { class: "hero card" }, [
    el("img", { src: "/assets/images/hero.png", alt: "Hero" }),
    el("div", { class: "copy" }, [
      el("h1", {}, ["Lovable + Cloudflare Pages + Prerender"]),
      el("p", {}, ["This homepage and other routes are rendered client-side. With Prerender enabled, bots will receive fully rendered HTML."]),
      el("div", { class: "cta" }, [
        el("a", { class:"btn alt btnlike", href:"/gallery", "data-link":"" }, ["See Gallery"]),
        el("span", { style:"display:inline-block;width:10px" }),
        el("a", { class:"btn btnlike", href:"/products", "data-link":"" }, ["Explore Products"])
      ])
    ])
  ]);
  wrap.appendChild(hero);

  // Featured products
  const grid = el("div", { class: "grid", style:"margin-top:18px" });
  for (let i=1;i<=3;i++){
    const c = el("div", { class:"card" }, [
      el("img", { src:`/assets/images/product_0${i}.png`, alt:`Product ${i}` }),
      el("h3", {}, [`Featured Product ${i}`]),
      el("p", { class:"small" }, ["High-quality placeholder to make the page heavy for bots."])
    ]);
    grid.appendChild(c);
  }
  wrap.appendChild(grid);
  return wrap;
}

async function Gallery(){
  await sleep(400);
  const wrap = el("section");
  wrap.appendChild(el("h2", {}, ["Gallery"]));
  const grid = el("div", { class:"grid" });
  for (let i=1;i<=12;i++){
    const c = el("div", { class:"card" }, [
      el("img", { src:`/assets/images/gallery_${String(i).padStart(2,'0')}.png`, alt:`Gallery ${i}` }),
      el("p", { class:"small" }, [`Gallery item ${i}`])
    ]);
    grid.appendChild(c);
  }
  wrap.appendChild(grid);
  return wrap;
}

async function Products(){
  await sleep(500);
  const wrap = el("section");
  wrap.appendChild(el("h2", {}, ["Products"]));
  const grid = el("div", { class:"grid" });
  for (let i=1;i<=6;i++){
    const c = el("div", { class:"card" }, [
      el("img", { src:`/assets/images/product_${String(i).padStart(2,'0')}.png`, alt:`Product ${i}` }),
      el("h3", {}, [`Product ${i}`]),
      el("p", {}, ["Lorem ipsum dolor sit amet, consectetur adipiscing elit."]),
      el("a", { class:"btn btnlike", href:`/products/${i}`, "data-link":"" }, ["View"])
    ]);
    grid.appendChild(c);
  }
  wrap.appendChild(grid);
  return wrap;
}

async function ProductDetail(id){
  await sleep(500);
  const i = Number(id)||1;
  return el("section", {}, [
    el("h2", {}, [`Product ${i}`]),
    el("div", { class:"card" }, [
      el("img", { src:`/assets/images/product_${String(i).padStart(2,'0')}.png`, alt:`Product ${i}` }),
      el("p", {}, ["Detailed description for Product ", String(i), ". This is JS-rendered for Prerender QA."])
    ]),
    el("p", {}, [el("a", { href:"/products", "data-link":"" }, ["← Back to products"]) ])
  ]);
}

async function Blog(){
  await sleep(400);
  const wrap = el("section");
  wrap.appendChild(el("h2", {}, ["Blog"]));
  const res = await fetch("https://jsonplaceholder.typicode.com/posts?_limit=6");
  const posts = await res.json();
  for (const p of posts){
    const c = el("div", { class:"card" }, [
      el("h3", {}, [p.title]),
      el("p", {}, [p.body])
    ]);
    wrap.appendChild(c);
  }
  return wrap;
}

async function Contact(){
  await sleep(300);
  return el("section", {}, [
    el("h2", {}, ["Contact"]),
    el("p", {}, ["This is a demo contact page."]),
    el("pre", {}, [el("code", {}, ['curl -I -A "Googlebot" https://<your-site>/gallery'])])
  ]);
}

const routes = [
  { pattern: /^\/$/, view: () => Home() },
  { pattern: /^\/gallery\/?$/, view: () => Gallery() },
  { pattern: /^\/products\/?$/, view: () => Products() },
  { pattern: /^\/products\/(\d+)$/, view: (m) => ProductDetail(m[1]) },
  { pattern: /^\/blog\/?$/, view: () => Blog() },
  { pattern: /^\/contact\/?$/, view: () => Contact() },
];

async function render(pathname){
  const match = routes.map(r => ({r, m: pathname.match(r.pattern)})).find(x => x.m);
  const view = match ? match.r.view : () => Home();
  app.innerHTML = "<p>Rendering (client-side)…</p>";
  const node = await view(match ? match.m : undefined);
  app.innerHTML = "";
  app.appendChild(node);
  window.scrollTo(0,0);
}

function onLinkClick(e){
  const a = e.target.closest("a[data-link]");
  if (!a) return;
  e.preventDefault();
  const url = new URL(a.href, location.origin);
  history.pushState({}, "", url.pathname);
  render(url.pathname);
}

window.addEventListener("popstate", () => render(location.pathname));
window.addEventListener("DOMContentLoaded", () => {
  document.body.addEventListener("click", onLinkClick);
  render(location.pathname);
});
