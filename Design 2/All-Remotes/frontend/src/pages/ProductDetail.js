import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { ShoppingCart, ArrowLeft, Check, Heart, Star, Send } from 'lucide-react';
import { toast } from 'sonner';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProductDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [inWishlist, setInWishlist] = useState(false);
  const { addToCart } = useCart();
  
  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ average_rating: 0, total_reviews: 0, rating_breakdown: {} });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, title: '', comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchProduct();
    fetchReviews();
    if (user) {
      checkWishlist();
    }
  }, [id, user]);

  const fetchProduct = async () => {
    try {
      const response = await axios.get(`${API}/products/${id}`);
      setProduct(response.data);
      
      // Use new related products API
      const relatedRes = await axios.get(`${API}/products/${id}/related?limit=4`);
      setRelatedProducts(relatedRes.data);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Product not found');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`${API}/reviews/${id}`);
      setReviews(response.data.reviews || []);
      setReviewStats({
        average_rating: response.data.average_rating || 0,
        total_reviews: response.data.total_reviews || 0,
        rating_breakdown: response.data.rating_breakdown || {}
      });
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to write a review');
      return;
    }
    
    if (!newReview.title.trim() || !newReview.comment.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setSubmittingReview(true);
    try {
      await axios.post(`${API}/reviews`, {
        product_id: id,
        user_email: user.email,
        user_name: user.name,
        rating: newReview.rating,
        title: newReview.title,
        comment: newReview.comment
      });
      toast.success('Review submitted successfully!');
      setShowReviewForm(false);
      setNewReview({ rating: 5, title: '', comment: '' });
      fetchReviews();
    } catch (error) {
      if (error.response?.status === 400) {
        toast.error('You have already reviewed this product');
      } else {
        toast.error('Failed to submit review');
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  const checkWishlist = async () => {
    if (!user) return;
    try {
      const response = await axios.get(`${API}/wishlist/${user.email}`);
      setInWishlist(response.data.some(p => p.id === id));
    } catch (error) {
      console.error('Error checking wishlist:', error);
    }
  };

  const toggleWishlist = async () => {
    if (!user) {
      toast.error('Please login to add to wishlist');
      return;
    }

    try {
      if (inWishlist) {
        await axios.delete(`${API}/wishlist/${user.email}/${id}`);
        setInWishlist(false);
        toast.success('Removed from wishlist');
      } else {
        await axios.post(`${API}/wishlist?user_email=${user.email}&product_id=${id}`);
        setInWishlist(true);
        toast.success('Added to wishlist');
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      toast.error('Failed to update wishlist');
    }
  };

  const handleAddToCart = () => {
    if (product && product.stock > 0) {
      addToCart(product, quantity);
      toast.success(`Added ${quantity} ${product.name} to cart`);
    }
  };

  const StarRating = ({ rating, size = 'md', interactive = false, onChange }) => {
    const sizes = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6' };
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && onChange && onChange(star)}
            className={interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}
            disabled={!interactive}
          >
            <Star
              className={`${sizes[size]} ${
                star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-border w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="aspect-square bg-border"></div>
              <div>
                <div className="h-8 bg-border mb-4"></div>
                <div className="h-4 bg-border w-3/4 mb-8"></div>
                <div className="h-16 bg-border"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Product not found</h1>
          <Link to="/shop">
            <Button>Back to Shop</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-8">
        <Link to="/shop" className="inline-flex items-center gap-2 text-sm font-medium hover:text-primary mb-8" data-testid="back-to-shop">
          <ArrowLeft className="h-4 w-4" /> Back to Shop
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12" data-testid="product-detail">
          <div>
            <div className="bg-white border border-border rounded-sm p-8 mb-4">
              <Zoom>
                <img
                  src={product.images[selectedImage]}
                  alt={product.name}
                  className="w-full h-auto object-contain cursor-zoom-in"
                  data-testid="product-image"
                />
              </Zoom>
            </div>
            
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto" data-testid="image-gallery">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`flex-shrink-0 w-20 h-20 border-2 rounded overflow-hidden ${
                      selectedImage === idx ? 'border-primary' : 'border-border'
                    }`}
                    data-testid={`thumbnail-${idx}`}
                  >
                    <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-sm text-primary uppercase tracking-wide font-bold mb-2" data-testid="product-brand">
              {product.brand}
            </p>
            <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight" style={{ fontFamily: 'Chivo, sans-serif' }} data-testid="product-name">
              {product.name}
            </h1>
            
            {/* Rating Summary */}
            <div className="flex items-center gap-3 mb-4" data-testid="rating-summary">
              <StarRating rating={Math.round(reviewStats.average_rating)} />
              <span className="text-sm text-gray-600">
                {reviewStats.average_rating.toFixed(1)} ({reviewStats.total_reviews} reviews)
              </span>
            </div>
            
            <div className="flex items-center gap-4 mb-6">
              <p className="text-4xl font-black text-primary" style={{ fontFamily: 'Chivo, sans-serif' }} data-testid="product-price">
                ${product.price.toFixed(2)}
              </p>
              {product.stock > 0 ? (
                <span className="inline-flex items-center gap-1 text-status-success font-medium" data-testid="stock-status">
                  <Check className="h-4 w-4" /> In Stock ({product.stock} available)
                </span>
              ) : (
                <span className="text-status-error font-medium" data-testid="stock-status-out">
                  Out of Stock
                </span>
              )}
            </div>

            <p className="text-base text-text-primary mb-8 leading-relaxed" data-testid="product-description">
              {product.description}
            </p>

            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="bg-background border border-border rounded-sm p-6 mb-8" data-testid="specifications">
                <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Chivo, sans-serif' }}>
                  Specifications
                </h3>
                <dl className="space-y-2">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <dt className="text-sm text-text-secondary capitalize">{key}:</dt>
                      <dd className="text-sm font-medium">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {product.stock > 0 && (
              <div className="flex items-center gap-4 mb-6">
                <label className="text-sm font-medium">Quantity:</label>
                <div className="flex items-center border border-border rounded-sm">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 hover:bg-background"
                    data-testid="decrease-quantity"
                  >
                    -
                  </button>
                  <span className="px-6 py-2 border-l border-r border-border" data-testid="quantity-display">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="px-4 py-2 hover:bg-background"
                    data-testid="increase-quantity"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <Button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="w-full bg-red-600 text-white hover:bg-red-700 h-12 text-base font-bold uppercase tracking-wide mb-3 shadow-md"
              data-testid="add-to-cart-button"
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
            </Button>

            <Button
              onClick={toggleWishlist}
              variant="outline"
              className="w-full h-12 border-2 border-gray-300 text-gray-700 hover:border-red-500 hover:text-red-600"
              data-testid="wishlist-button"
            >
              <Heart className={`mr-2 h-5 w-5 ${inWishlist ? 'fill-primary text-primary' : ''}`} />
              {inWishlist ? 'In Wishlist' : 'Add to Wishlist'}
            </Button>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16 border-t border-gray-200 pt-12" data-testid="reviews-section">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h2 className="text-3xl font-black mb-2" style={{ fontFamily: 'Chivo, sans-serif' }}>
                Customer Reviews
              </h2>
              <div className="flex items-center gap-3">
                <StarRating rating={Math.round(reviewStats.average_rating)} size="lg" />
                <span className="text-lg font-medium">{reviewStats.average_rating.toFixed(1)} out of 5</span>
                <span className="text-gray-500">({reviewStats.total_reviews} reviews)</span>
              </div>
            </div>
            
            {user && !showReviewForm && (
              <Button 
                onClick={() => setShowReviewForm(true)}
                className="mt-4 md:mt-0 bg-red-600 hover:bg-red-700"
                data-testid="write-review-button"
              >
                Write a Review
              </Button>
            )}
          </div>

          {/* Rating Breakdown */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8 max-w-md">
            <h3 className="font-semibold mb-4">Rating Breakdown</h3>
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="flex items-center gap-3 mb-2">
                <span className="w-8 text-sm text-gray-600">{star} star</span>
                <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-yellow-400 rounded-full"
                    style={{ 
                      width: reviewStats.total_reviews > 0 
                        ? `${((reviewStats.rating_breakdown[star] || 0) / reviewStats.total_reviews) * 100}%` 
                        : '0%' 
                    }}
                  />
                </div>
                <span className="w-8 text-sm text-gray-600 text-right">
                  {reviewStats.rating_breakdown[star] || 0}
                </span>
              </div>
            ))}
          </div>

          {/* Review Form */}
          {showReviewForm && user && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8" data-testid="review-form">
              <h3 className="text-xl font-bold mb-4">Write Your Review</h3>
              <form onSubmit={submitReview}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Your Rating</label>
                  <StarRating 
                    rating={newReview.rating} 
                    size="lg" 
                    interactive 
                    onChange={(rating) => setNewReview({ ...newReview, rating })}
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Review Title</label>
                  <input
                    type="text"
                    value={newReview.title}
                    onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                    placeholder="Summarize your experience"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    data-testid="review-title-input"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Your Review</label>
                  <textarea
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                    placeholder="Share your experience with this product..."
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    data-testid="review-comment-input"
                  />
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    type="submit" 
                    disabled={submittingReview}
                    className="bg-red-600 hover:bg-red-700"
                    data-testid="submit-review-button"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setShowReviewForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Reviews List */}
          {reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white border border-gray-200 rounded-lg p-6" data-testid={`review-${review.id}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-semibold">{review.user_name}</span>
                        <StarRating rating={review.rating} size="sm" />
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(review.created_at).toLocaleDateString('en-AU', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                  <h4 className="font-semibold text-lg mb-2">{review.title}</h4>
                  <p className="text-gray-700">{review.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-4">No reviews yet. Be the first to review this product!</p>
              {!user && (
                <Link to="/login">
                  <Button variant="outline">Login to Write a Review</Button>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16" data-testid="related-products">
            <h2 className="text-3xl font-black mb-6" style={{ fontFamily: 'Chivo, sans-serif' }}>
              Related Products
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map(related => (
                <Link
                  key={related.id}
                  to={`/product/${related.id}`}
                  className="group bg-white border border-border rounded-sm overflow-hidden hover:shadow-hover transition-all duration-300"
                >
                  <div className="aspect-square overflow-hidden bg-background">
                    <img
                      src={related.images[0]}
                      alt={related.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-text-secondary uppercase tracking-wide mb-1">{related.brand}</p>
                    <h3 className="font-bold text-sm mb-2 line-clamp-2">{related.name}</h3>
                    <p className="text-primary text-lg font-black" style={{ fontFamily: 'Chivo, sans-serif' }}>
                      ${related.price.toFixed(2)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default ProductDetail;
