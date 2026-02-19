import React from "react";
import { useLocation, Link } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import ProductCard from "../components/ProductCard";
import heroImg2 from "../Images/heroimg2.jpg";
import "./CategoryPage.css";

const CategoryPage = () => {
  const location = useLocation();
  const { getNavigation, getProducts } = useStore();
  const navigationMenu = getNavigation();
  const allProducts = getProducts();
  const category = location.pathname.split("/")[1] || "";

  const categoryMap = {
    "garage-gate": "garage-gate",
    automotive: "automotive",
    "for-the-home": "for-the-home",
    locksmithing: "locksmithing",
    "shop-by-brand": "shop-by-brand",
    support: "support",
    contact: "contact",
  };

  const menuItem = navigationMenu[categoryMap[category] || category];

  const visibleColumns = (menuItem?.columns || [])
    .map((col) => ({
      ...col,
      items: (col.items || []).filter((i) => !i?.hidden),
    }))
    .filter((col) => (col.items || []).length > 0);

  let products = [];
  if (category === "garage-gate") {
    products = (allProducts || []).filter((p) => p.category === "garage");
  } else if (category === "automotive") {
    products = (allProducts || []).filter((p) => p.category === "car");
  } else {
    products = allProducts || [];
  }

  if (!menuItem || menuItem.hidden) {
    return (
      <div className="category-page">
        <div className="container">
          <h1>Page Not Found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="category-page">
      {category !== "contact" && (
        <div
          className="category-hero"
          style={{
            backgroundImage: `url(${heroImg2})`,
          }}
        >
          <div className="category-hero-overlay"></div>
          <div className="container">
            <h1>{menuItem.title}</h1>
            <p className="category-subtitle">
              {category === "garage-gate" &&
                "Explore our wide range of garage and gate automation products"}
              {category === "automotive" &&
                "Find the perfect automotive keys and remotes for your vehicle"}
              {category === "for-the-home" &&
                "Discover home automation solutions and remotes"}
              {category === "locksmithing" &&
                "Professional locksmithing tools and equipment"}
              {category === "shop-by-brand" && "Shop by your favorite brand"}
              {category === "support" &&
                "Get help, find manuals, and access support resources"}
              {category === "contact" && "Get in touch with our team"}
            </p>
          </div>
        </div>
      )}

      {/* {visibleColumns.length > 0 && (
        <div className="category-sections">
          <div className="container">
            {visibleColumns.map((column, index) => (
              <section key={index} className="category-section">
                <h2 className="section-title">{column.title}</h2>
                <div className="section-links">
                  {column.items.map((item, itemIndex) => (
                    <Link
                      key={itemIndex}
                      //to={item.path}
                      to="/products/all"
                      className="section-link"
                    >
                      <span className="link-icon">
                        <img src={item.icon} alt={item.name} />
                      </span>
                      <span>{item.name}</span>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      )} */}

      {visibleColumns.length > 0 && (
        <div className="category-sections">
          <div className="container">
            {visibleColumns.map((column, index) => (
              <section key={index} className="category-section">
                <h2 className="section-title">{column.title}</h2>
                <div className="section-links">
                  {column.items.map((item, itemIndex) => (
                    <Link
                      key={itemIndex}
                      to={
                        category === "shop-by-brand"
                          ? `/products/all?brand=${encodeURIComponent(item.name.toUpperCase())}`
                          : "/products/all"
                      }
                      className="section-link"
                    >
                      <span className="link-icon">
                        <img src={item.icon} alt={item.name} />
                      </span>
                      <span>{item.name}</span>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}

      {products.length > 0 && category !== "contact" && (
        <div className="category-products">
          <div className="container">
            <h2 className="products-title">Featured Products</h2>
            <div className="products-grid">
              {products.slice(0, 6).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </div>
      )}

      {category === "contact" && (
        <div className="contact-section">
          <div className="container">
            <div className="contact-content">
              <div className="contact-info">
                <h2>Get in Touch</h2>
                <div className="contact-details">
                  <div className="contact-item">
                    <h3>Email</h3>
                    <p>support@allremotes.com</p>
                  </div>
                  <div className="contact-item">
                    <h3>Phone</h3>
                    <p>1-800-REMOTES</p>
                  </div>
                  <div className="contact-item">
                    <h3>Business Hours</h3>
                    <p>Monday - Friday: 9:00 AM - 5:00 PM</p>
                    <p>Saturday: 10:00 AM - 2:00 PM</p>
                  </div>
                </div>
              </div>
              <div className="contact-form">
                <h2>Send us a Message</h2>
                <form>
                  <div className="form-group">
                    <input type="text" placeholder="Your Name" required />
                  </div>
                  <div className="form-group">
                    <input type="email" placeholder="Your Email" required />
                  </div>
                  <div className="form-group">
                    <textarea
                      placeholder="Your Message"
                      rows="5"
                      required
                    ></textarea>
                  </div>
                  <button type="submit" className="btn btn-primary">
                    Send Message
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryPage;
