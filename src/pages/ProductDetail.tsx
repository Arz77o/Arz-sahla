import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, Star, Check, AlertCircle, Loader2 } from 'lucide-react';
import { SEOMeta } from '../components/shared/SEOMeta';
import { supabase } from '../lib/supabase';
import { formatDZD, calculatePriceDZD } from '../lib/pricing';
import { useCartStore } from '../store/cartStore';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<{group: string, option: string} | null>(null);

  const { addItem, isInCart } = useCartStore();

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', slug) // Assuming slug is ID for now, or we need to query by slug if added
        .single();
        
      if (error || !data) {
        toast.error('المنتج غير موجود');
        navigate('/products');
        return;
      }

      setProduct(data);
      setSelectedImage(data.images?.[0] || '');
      if (data.variants && data.variants.length > 0) {
        setSelectedVariant({ group: data.variants[0].group, option: data.variants[0].options[0] });
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
  const priceDZD = calculatePriceDZD(product.price_usd);
  const inCart = isInCart(product.id);

  const handleAddToCart = () => {
    if (inCart) {
      toast.error(t('cart.alreadyInCart'));
      return;
    }
    
    addItem({
      product_id: product.id,
      name_ar: product.name_ar,
      name_en: product.name_en,
      price_dzd: priceDZD,
      image: product.images?.[0] || '',
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
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 flex gap-3 text-amber-800">
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
        <div className="mt-8 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-10">
          <h2 className="text-xl font-bold mb-6">وصف المنتج</h2>
          <div className="prose max-w-none text-gray-600 whitespace-pre-line">
            {description || 'لا يوجد وصف متاح.'}
          </div>
        </div>
      </div>
    </>
  );
}
