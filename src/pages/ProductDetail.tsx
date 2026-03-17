import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, Star, Check, AlertCircle, Loader2, ExternalLink, X } from 'lucide-react';
import { SEOMeta } from '../components/shared/SEOMeta';
import { supabase } from '../lib/supabase';
import { formatDZD, calculatePriceDZD } from '../lib/pricing';
import { useCartStore } from '../store/cartStore';
import { useSettingsStore } from '../store/settingsStore';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { usd_to_dzd_rate, commission_rate } = useSettingsStore();
  const isAr = i18n.language === 'ar';
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<{group: string, option: string} | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const { addItem, isInCart } = useCartStore();

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*, reviews(*)')
        .eq('id', slug) 
        .single();
        
      if (error || !data) {
        toast.error('المنتج غير موجود');
        navigate('/products');
        return;
      }

      const productData = data as any;
      setProduct(productData);
      setSelectedImage(productData.images?.[0] || '');
      if (productData.variants && productData.variants.length > 0) {
        setSelectedVariant({ group: productData.variants[0].group, option: productData.variants[0].options[0] });
      }
      setLoading(false);
    };

    fetchProduct();
  }, [slug, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!product) return null;

  const name = isAr ? product.name_ar : product.name_en;
  const description = isAr ? product.description_ar : product.description_en;
  const priceDZD = calculatePriceDZD(product.price_usd, usd_to_dzd_rate, commission_rate);
  const inCart = isInCart(product.id);

  const handleAddToCart = () => {
    if (inCart) {
      toast.error(t('cart.alreadyInCart'));
      return;
    }
    
    const imageUrl = product.images?.[0] || '';
    const absoluteImageUrl = imageUrl.startsWith('http') 
      ? imageUrl 
      : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/products/${imageUrl}`;

    addItem({
      product_id: product.id,
      name_ar: product.name_ar,
      name_en: product.name_en,
      price_dzd: priceDZD,
      image: absoluteImageUrl,
      variant: selectedVariant
    });
  };

  return (
    <>
      <SEOMeta title={name} description={description?.substring(0, 150)} image={selectedImage} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 md:p-10">
            
            {/* Images */}
            <div className="space-y-4">
              <div className="aspect-square rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                <img 
                  src={selectedImage || 'https://picsum.photos/seed/sahla/800/800'} 
                  alt={name}
                  className="w-full h-full object-cover"
                />
              </div>
              {product.images && product.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {product.images.map((img: string, idx: number) => (
                    <button 
                      key={idx}
                      onClick={() => setSelectedImage(img)}
                      className={`w-20 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-colors ${
                        selectedImage === img ? 'border-blue-600' : 'border-transparent hover:border-gray-200'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex flex-col">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <Check className="w-3 h-3" />
                    {t('product.available')}
                  </span>
                  {product.product_badge && (
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold text-white ${
                      product.product_badge === 'brand' ? 'bg-blue-600' : 'bg-emerald-500'
                    }`}>
                      {product.product_badge === 'brand' ? t('product.brand') : t('product.choice')}
                    </span>
                  )}
                  <div className="flex items-center gap-1 text-sm text-gray-600 ml-auto">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{product.avg_rating.toFixed(1)}</span>
                  </div>
                </div>
                
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 leading-tight">
                  {name}
                </h1>
                
                <div className="text-4xl font-black text-blue-600 mb-6">
                  {formatDZD(priceDZD)}
                </div>
              </div>

              {/* Variants */}
              {product.variants && product.variants.length > 0 && (
                <div className="mb-8 space-y-4">
                  {product.variants.map((variantGroup: any, idx: number) => (
                    <div key={idx}>
                      <h3 className="text-sm font-medium text-gray-900 mb-3">{variantGroup.group}</h3>
                      <div className="flex flex-wrap gap-2">
                        {variantGroup.options.map((option: string, optIdx: number) => {
                          const isSelected = selectedVariant?.group === variantGroup.group && selectedVariant?.option === option;
                          return (
                            <button
                              key={optIdx}
                              onClick={() => setSelectedVariant({ group: variantGroup.group, option })}
                              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                                isSelected 
                                  ? 'bg-blue-50 border-blue-600 text-blue-700' 
                                  : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                              }`}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Shipping Notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex gap-3 text-amber-800">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="text-sm leading-relaxed whitespace-pre-line">
                  {t('product.shippingNotice')}
                </div>
              </div>



              {/* Add to Cart */}
              <div className="mt-auto pt-6 border-t border-gray-100">
                <Button 
                  size="lg" 
                  className={`w-full h-14 text-lg font-bold rounded-xl ${
                    inCart ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                  onClick={handleAddToCart}
                  disabled={inCart}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {inCart ? t('product.inCart') : t('product.addToCart')}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-10">
              <h2 className="text-xl font-bold mb-6">{t('product.description')}</h2>
              <div className="prose max-w-none text-gray-600 whitespace-pre-line leading-relaxed">
                {description || 'لا يوجد وصف متاح.'}
              </div>
            </div>

            {/* Reviews Section */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-10">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold">{t('product.buyerReviews')}</h2>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star key={star} className={`w-4 h-4 ${star <= Math.round(product.avg_rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                    ))}
                  </div>
                  <span className="font-bold text-gray-900">{product.avg_rating.toFixed(1)}</span>
                  <span className="text-gray-400 text-sm">({product.reviews?.length || 0})</span>
                </div>
              </div>

              <div className="space-y-8">
                {product.reviews && product.reviews.length > 0 ? (
                  product.reviews.map((review: any) => (
                    <div key={review.id} className="border-b border-gray-100 pb-8 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center font-bold text-blue-600">
                            {review.full_name?.[0] || 'A'}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 text-sm">{review.full_name || 'عميل مجهول'}</div>
                            <div className="flex gap-0.5 mt-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                              ))}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString('ar-DZ')}</span>
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed mb-4">{review.comment}</p>
                      
                      {review.images && review.images.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {review.images.map((img: string, i: number) => (
                            <div 
                              key={i} 
                              className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100 cursor-zoom-in hover:opacity-80 transition-opacity"
                              onClick={() => setZoomedImage(img)}
                            >
                              <img src={img} alt="" className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10">
                    <p className="text-gray-400">لا توجد تقييمات لهذا المنتج بعد.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-blue-600 rounded-2xl p-8 text-white sticky top-24 overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-4">{t('product.whyChoose')}</h3>
                <ul className="space-y-4">
                  <li className="flex gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">✓</div>
                    <span>{t('product.guaranteed')}</span>
                  </li>
                  <li className="flex gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">✓</div>
                    <span>{t('product.securePay')}</span>
                  </li>
                  <li className="flex gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">✓</div>
                    <span>{t('product.fastDelivery')}</span>
                  </li>
                </ul>
              </div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            </div>
          </div>
        </div>

        {/* Image Zoom Lightbox */}
        {zoomedImage && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 md:p-12 animate-in fade-in duration-200"
            onClick={() => setZoomedImage(null)}
          >
            <button 
              className="absolute top-6 right-6 text-white bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors"
              onClick={() => setZoomedImage(null)}
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={zoomedImage} 
              className="max-w-full max-h-full rounded-xl shadow-2xl animate-in zoom-in-95 duration-200"
              alt="Zoomed Review" 
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    </>
  );
}
