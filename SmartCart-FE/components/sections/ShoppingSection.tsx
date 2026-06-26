"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Loader2, Search, Send, ShoppingCart, Sparkles } from "lucide-react";
import { BunnyMascot } from "@/components/bunny/BunnyMascot";
import { ProductAdvancedFilters } from "@/components/products/ProductAdvancedFilters";
import { ProductDetailModal } from "@/components/products/ProductDetailModal";
import { ProductImage } from "@/components/products/ProductImage";
import { chatService, type ChatMessage } from "@/services/chatService";
import { productService } from "@/services/productService";
import { useAuthModalStore } from "@/store/authModalStore";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useToastStore } from "@/store/toastStore";
import type { Category, Product } from "@/types";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/utils/cn";
import { applyProductFilters, type ProductSortOrder } from "@/utils/productFilters";

const decorativeTrees = [
  { src: "/images/trees/tree-01.png", className: "bottom-20 left-[21%] w-20 md:w-28" },
  { src: "/images/trees/tree-05.png", className: "bottom-16 left-[27%] w-24 md:w-32" },
  { src: "/images/trees/tree-03.png", className: "bottom-24 left-[33%] w-16 md:w-24" },
  { src: "/images/trees/tree-04.png", className: "bottom-[4.5rem] right-[27%] w-20 md:w-28" },
  { src: "/images/trees/tree-02.png", className: "bottom-[3.75rem] right-[21%] w-20 md:w-28" },
  { src: "/images/trees/tree-06.png", className: "bottom-20 right-[16%] w-16 md:w-24" },
  { src: "/images/trees/tree-05.png", className: "bottom-[7.5rem] right-[33%] hidden w-20 md:block md:w-28" },
  { src: "/images/trees/tree-01.png", className: "bottom-28 left-[15%] hidden w-[4.5rem] md:block md:w-24" }
];

const INITIAL_PRODUCT_LIMIT = 16;
const PRODUCT_LOAD_STEP = 12;

export function ShoppingSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cartNotice, setCartNotice] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [sortOrder, setSortOrder] = useState<ProductSortOrder>("newest");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [visibleProductLimit, setVisibleProductLimit] = useState(INITIAL_PRODUCT_LIMIT);
  const [showChatBunny, setShowChatBunny] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Xin chào! Mình là trợ lý SmartCart. Bạn muốn tìm sản phẩm hay kiểm tra đơn hàng?",
      actions: [
        { label: "Tìm đồ ăn", href: "tìm đồ ăn", type: "prompt" },
        { label: "Đồ uống dưới 30k", href: "tìm đồ uống dưới 30k", type: "prompt" },
        { label: "Xem giỏ hàng", href: "/cart" },
        { label: "Kiểm tra đơn", href: "/orders" }
      ]
    }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const historyLoadedRef = useRef(false);
  const { addToCart, loading: cartLoading } = useCartStore();
  const { accessToken, hydrate, logout } = useAuthStore();
  const { openLogin } = useAuthModalStore();
  const { showToast } = useToastStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const updateChatBunny = () => {
      const shopSection = document.getElementById("shop");
      if (!shopSection) return;
      const sectionTop = shopSection.getBoundingClientRect().top;
      const shouldShow = sectionTop <= window.innerHeight * 0.42;
      setShowChatBunny(shouldShow);
      if (!shouldShow) setChatOpen(false);
    };

    updateChatBunny();
    window.addEventListener("scroll", updateChatBunny, { passive: true });
    window.addEventListener("resize", updateChatBunny);
    return () => {
      window.removeEventListener("scroll", updateChatBunny);
      window.removeEventListener("resize", updateChatBunny);
    };
  }, []);

  useEffect(() => {
    if (!chatOpen || historyLoadedRef.current || !accessToken) return;

    let mounted = true;
    chatService
      .getHistory()
      .then((history) => {
        if (!mounted) return;
        historyLoadedRef.current = true;
        if (history.length === 0) return;
        setChatMessages(
          history.map((message) => ({
            ...message,
            role: message.role === "model" ? "assistant" : message.role
          }))
        );
      })
      .catch(() => {
        historyLoadedRef.current = true;
      });

    return () => {
      mounted = false;
    };
  }, [accessToken, chatOpen]);

  useEffect(() => {
    if (!chatOpen) return;
    chatScrollRef.current?.scrollTo({
      top: chatScrollRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [chatMessages, chatLoading, chatOpen]);

  const getUrlKeyword = () => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("q") || "";
  };

  const fetchProducts = async (nextCategoryId = selectedCategoryId, nextKeyword = keyword) => {
    setLoading(true);
    setError("");
    try {
      const trimmedKeyword = nextKeyword.trim();
      const productData =
        nextCategoryId && !trimmedKeyword
          ? await productService.getProductsByCategory(nextCategoryId)
          : await productService.getProducts({
              categoryId: nextCategoryId || undefined,
              keyword: trimmedKeyword || undefined
            });
      setProducts(productData);
      setVisibleProductLimit(INITIAL_PRODUCT_LIMIT);
    } catch (requestError) {
      const errorMessage = requestError instanceof Error ? requestError.message : "Không gửi được tin nhắn.";
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const initialKeyword = getUrlKeyword();
    if (initialKeyword) setKeyword(initialKeyword);

    Promise.all([
      productService.getProducts({ keyword: initialKeyword || undefined }),
      productService.getCategories()
    ])
      .then(([productData, categoryData]) => {
        if (!mounted) return;
        setProducts(productData);
        setCategories(categoryData.filter((category) => category.name.trim().toLowerCase() !== "tất cả"));
        setVisibleProductLimit(INITIAL_PRODUCT_LIMIT);
      })
      .catch((requestError) => {
        if (!mounted) return;
      const errorMessage = requestError instanceof Error ? requestError.message : "Không gửi được tin nhắn.";
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const onHeaderSearch = (event: Event) => {
      const customEvent = event as CustomEvent<{ keyword?: string }>;
      const nextKeyword = customEvent.detail?.keyword || "";
      setKeyword(nextKeyword);
      setVisibleProductLimit(INITIAL_PRODUCT_LIMIT);
      void fetchProducts(selectedCategoryId, nextKeyword);
    };

    window.addEventListener("smartcart:product-search", onHeaderSearch);
    return () => window.removeEventListener("smartcart:product-search", onHeaderSearch);
  }, [selectedCategoryId]);

  const selectCategory = async (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
    setVisibleProductLimit(INITIAL_PRODUCT_LIMIT);
    await fetchProducts(categoryId, keyword);
  };

  const searchProducts = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedKeyword = keyword.trim();
    const query = trimmedKeyword ? `?q=${encodeURIComponent(trimmedKeyword)}` : "";
    window.history.replaceState({}, "", `${query}#shop`);
    setVisibleProductLimit(INITIAL_PRODUCT_LIMIT);
    await fetchProducts(selectedCategoryId, keyword);
  };

  const clearSearch = async () => {
    setKeyword("");
    setSelectedCategoryId(null);
    setVisibleProductLimit(INITIAL_PRODUCT_LIMIT);
    window.history.replaceState({}, "", "/#shop");
    await fetchProducts(null, "");
  };

  const requireLogin = () => {
    if (accessToken || (typeof window !== "undefined" && localStorage.getItem("smartcart_access_token"))) return true;
    openLogin();
    return false;
  };

  const addProductToCart = async (productId: string) => {
    setCartNotice("");
    setError("");
    try {
      await addToCart(productId, 1);
      setCartNotice("Đã thêm sản phẩm vào giỏ hàng.");
      showToast("Đã thêm sản phẩm vào giỏ hàng.");
    } catch (requestError) {
      const errorMessage = requestError instanceof Error ? requestError.message : "Không thêm được sản phẩm vào giỏ hàng.";
      setError(errorMessage);
      showToast(errorMessage, "error");
      if (errorMessage.toLowerCase().includes("unauthorized") || errorMessage.includes("401")) {
        openLogin();
      }
    }
  };

  const visibleProducts = useMemo(
    () => applyProductFilters(products, { sortOrder, minPrice, maxPrice }),
    [maxPrice, minPrice, products, sortOrder]
  );
  const displayedProducts = useMemo(
    () => visibleProducts.slice(0, visibleProductLimit),
    [visibleProductLimit, visibleProducts]
  );
  const canLoadMoreProducts = displayedProducts.length < visibleProducts.length;

  const clearAdvancedFilters = () => {
    setSortOrder("newest");
    setMinPrice("");
    setMaxPrice("");
    setVisibleProductLimit(INITIAL_PRODUCT_LIMIT);
  };

  const toggleChatBubble = () => setChatOpen((isOpen) => !isOpen);

  const sendChatMessage = async (message: string) => {
    if (!message || chatLoading) return;

    setChatInput("");
    setChatMessages((messages) => [...messages, { role: "user", content: message }]);
    setChatLoading(true);

    try {
      const reply = await chatService.sendMessage(message);
      setChatMessages((messages) => [
        ...messages,
        {
          role: "assistant",
          content: reply.reply || "Mình chưa có câu trả lời phù hợp, bạn thử hỏi cách khác nhé.",
          actions: reply.actions || []
        }
      ]);
    } catch (requestError) {
      const errorMessage = requestError instanceof Error ? requestError.message : "Không gửi được tin nhắn.";
      if (errorMessage.toLowerCase().includes("unauthorized") || errorMessage.includes("401")) {
        logout();
        openLogin();
        setChatMessages((messages) => [
          ...messages,
          {
            role: "assistant",
            content: "Phiên đăng nhập của bạn đã hết hạn. Bạn đăng nhập lại rồi mình sẽ tiếp tục hỗ trợ nhé.",
            actions: [{ label: "Đăng nhập", href: "/#shop", type: "login" }]
          }
        ]);
        return;
      }
      setChatMessages((messages) => [...messages, { role: "assistant", content: errorMessage }]);
    } finally {
      setChatLoading(false);
    }
  };

  const submitChatMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await sendChatMessage(chatInput.trim());
  };

  const openProductFromChat = async (productId: string) => {
    try {
      const product = await productService.getProduct(productId);
      if (!product) {
        throw new Error("Không tìm thấy sản phẩm.");
      }
      setSelectedProduct(product);
      setChatOpen(false);
    } catch (requestError) {
      const errorMessage = requestError instanceof Error ? requestError.message : "Không mở được sản phẩm.";
      showToast(errorMessage, "error");
    }
  };

  return (
    <section id="shop" className="relative min-h-screen overflow-hidden bg-[#fff8ea] px-3 py-12 sm:px-6 sm:py-16 md:px-8">
      <PastelMarket />
      <motion.div
        className="relative z-10 mx-auto w-full max-w-6xl rounded-[1.5rem] border border-white/85 bg-white/88 p-3 shadow-soft backdrop-blur sm:rounded-cute sm:p-4 md:p-6"
        initial={{ opacity: 0, y: 70 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.01 }}
        transition={{ duration: 0.75, ease: "easeOut" }}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <a href="#shop" className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-skyPastel text-navySoft shadow-button">
              <ShoppingCart className="h-5 w-5" />
            </span>
            <span className="text-xl font-black text-navySoft">Bunny Shop</span>
          </a>
          <form onSubmit={searchProducts} className="relative flex min-h-12 flex-1 items-center rounded-full bg-cloud text-navyMuted md:max-w-md">
            <Search className="absolute left-4 h-5 w-5 shrink-0" />
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
                  placeholder="Nhập tin nhắn..."
              className="h-12 w-full rounded-full bg-transparent pl-12 pr-5 text-sm font-bold outline-none"
            />
          </form>
          <div className="flex items-center gap-3">
            {accessToken ? (
              <Link href="/cart" className="grid h-11 w-11 place-items-center rounded-full bg-navySoft text-white shadow-button" aria-label="Cart">
                <ShoppingCart className="h-5 w-5" />
              </Link>
            ) : (
              <button type="button" onClick={openLogin} className="grid h-11 w-11 place-items-center rounded-full bg-navySoft text-white shadow-button" aria-label="Cart">
                <ShoppingCart className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 flex gap-3 overflow-x-auto pb-2 soft-scrollbar">
          <button
            type="button"
            onClick={() => selectCategory(null)}
            className={cn(
              "flex min-w-max items-center gap-2 rounded-full border border-skyPastel/80 px-4 py-2.5 text-sm font-black shadow-button transition hover:-translate-y-0.5 hover:bg-skyPastel/35",
              selectedCategoryId ? "bg-white text-navySoft" : "bg-navySoft text-white"
            )}
          >
            <Sparkles className="h-4 w-4" />
            Tất cả
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => selectCategory(category.id)}
              className={cn(
                "flex min-w-max items-center gap-2 rounded-full border border-skyPastel/80 px-4 py-2.5 text-sm font-black shadow-button transition hover:-translate-y-0.5 hover:bg-skyPastel/35",
                selectedCategoryId === category.id ? "bg-navySoft text-white" : "bg-white text-navySoft"
              )}
            >
              {category.name}
            </button>
          ))}
        </div>

        {error && <p className="mt-5 rounded-full bg-blush px-5 py-3 text-sm font-bold text-navySoft">{error}</p>}
        {cartNotice && <p className="mt-5 rounded-full bg-mint px-5 py-3 text-sm font-bold text-navySoft">{cartNotice}</p>}
        {keyword.trim() && (
          <div className="mt-5 flex flex-wrap items-center gap-3 rounded-[1.25rem] bg-white/80 px-5 py-3 text-sm font-bold text-navySoft shadow-button">
            <span>Đang tìm: “{keyword.trim()}”</span>
            <button type="button" onClick={clearSearch} className="rounded-full bg-skyPastel px-4 py-2 text-xs font-black transition hover:-translate-y-0.5">
              Xóa tìm kiếm
            </button>
          </div>
        )}
        <div className="mt-6">
          <ProductAdvancedFilters
            sortOrder={sortOrder}
            minPrice={minPrice}
            maxPrice={maxPrice}
            resultCount={visibleProducts.length}
            onSortOrderChange={setSortOrder}
            onMinPriceChange={setMinPrice}
            onMaxPriceChange={setMaxPrice}
            onClear={clearAdvancedFilters}
          />
        </div>
        <div className="mt-6 grid gap-3 sm:mt-7 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {loading ? (
            <div className="col-span-full grid min-h-52 place-items-center rounded-[1.25rem] bg-cloud/80 shadow-button">
              <Loader2 className="h-8 w-8 animate-spin text-navySoft" />
            </div>
          ) : visibleProducts.length === 0 ? (
            <div className="col-span-full grid min-h-52 place-items-center rounded-[1.25rem] bg-cloud/80 p-8 text-center shadow-button">
              <p className="text-lg font-black text-navySoft">Chưa có sản phẩm để hiển thị.</p>
            </div>
          ) : (
            displayedProducts.map((product) => (
              <motion.article
                key={product.id}
                className="group rounded-[1.25rem] border border-white bg-cloud/80 p-3 shadow-button transition hover:-translate-y-2 hover:shadow-soft"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <button type="button" onClick={() => setSelectedProduct(product)} className="relative block aspect-[4/3] w-full overflow-hidden rounded-[1rem] bg-white text-left">
                  <ProductImage src={product.imageUrl} name={product.name} />
                </button>
                <div className="mt-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-navyMuted">{product.categoryName || "SmartCart"}</p>
                    <button type="button" onClick={() => setSelectedProduct(product)} className="mt-1 text-left font-black text-navySoft transition hover:text-[#6d5cff]">
                      {product.name}
                    </button>
                    <p className="mt-1 text-sm font-bold text-navyMuted">{formatCurrency(product.basePrice)}</p>
                  </div>
                  <button
                    type="button"
                    disabled={cartLoading}
                    onClick={() => addProductToCart(product.id)}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-navySoft shadow-button transition hover:bg-navySoft hover:text-white disabled:opacity-60"
                    aria-label={`Thêm ${product.name} vào giỏ`}
                  >
                    <ShoppingCart className="h-4 w-4" />
                  </button>
                </div>
              </motion.article>
            ))
          )}
        </div>
        {canLoadMoreProducts && (
          <div className="mt-7 flex justify-center">
            <button
              type="button"
              onClick={() => setVisibleProductLimit((limit) => limit + PRODUCT_LOAD_STEP)}
              className="rounded-full bg-white px-6 py-3 text-sm font-black text-navySoft shadow-button transition hover:-translate-y-0.5 hover:bg-skyPastel/35"
            >
              Xem thêm {Math.min(PRODUCT_LOAD_STEP, visibleProducts.length - displayedProducts.length)} sản phẩm
            </button>
          </div>
        )}
      </motion.div>

      <motion.div
        aria-label="Mở chatbot SmartCart"
        className="fixed bottom-2 left-2 z-30 block origin-bottom-left sm:left-4 md:bottom-3 md:left-6 lg:left-10"
        initial={false}
        animate={{
          opacity: showChatBunny ? 1 : 0,
          x: showChatBunny ? 0 : 42,
          y: showChatBunny ? 0 : 22,
          scale: showChatBunny ? 1 : 0.9,
          pointerEvents: showChatBunny ? "auto" : "none"
        }}
        transition={{
          opacity: { duration: 0.32 },
          x: { duration: 0.42, ease: "easeOut" },
          scale: { duration: 0.42, ease: "easeOut" },
          y: { duration: 0.32 }
        }}
      >
        {chatOpen && (
          <motion.div
            className="absolute bottom-[9.2rem] left-[2.25rem] h-[18rem] w-[19rem] max-w-[calc(100vw-3.25rem)] sm:bottom-[11rem] sm:left-[3.75rem] sm:h-[19rem] sm:w-[21rem] md:bottom-[14.5rem] md:left-[5.25rem] md:h-[20rem] md:w-[22rem] md:max-w-[calc(100vw-7rem)]"
            initial={{ opacity: 0, y: 22, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            <svg aria-hidden="true" viewBox="0 0 430 330" className="absolute inset-0 h-full w-full overflow-visible drop-shadow-[0_18px_34px_rgba(9,39,104,0.18)]">
              <path
                d="M50 31 C94 13 313 10 366 31 C401 45 407 88 400 178 C394 270 365 288 249 286 L118 285 L52 322 L72 280 C26 269 13 230 18 143 C22 72 30 39 50 31Z"
                fill="white"
                stroke="#050505"
                strokeWidth="7"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              <path
                d="M59 54 C53 78 52 100 52 121"
                fill="none"
                stroke="#050505"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M337 256 C354 254 368 248 378 235"
                fill="none"
                stroke="#050505"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M95 31 C161 20 281 22 339 31"
                fill="none"
                stroke="#050505"
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity="0.35"
              />
            </svg>
            <div className="absolute left-10 right-7 top-10 flex h-[12.8rem] flex-col sm:left-12 sm:right-8 sm:top-11 sm:h-[13.8rem] md:left-14 md:right-9 md:top-12 md:h-[14.5rem]">
              <p className="text-center text-base font-black text-navySoft">SmartCart Bot</p>
              <div ref={chatScrollRef} className="mt-3 flex-1 space-y-2 overflow-y-auto pr-1 soft-scrollbar">
                {chatMessages.map((message, index) => (
                  <ChatBubbleMessage
                    key={`${message.role}-${index}`}
                    message={message}
                    onLoginAction={openLogin}
                    onPromptAction={sendChatMessage}
                    onProductAction={openProductFromChat}
                  />
                ))}
                {chatLoading && (
                  <div className="mr-auto flex max-w-[88%] items-center gap-2 rounded-2xl bg-skyPastel/70 px-3 py-2 text-xs font-bold text-navySoft">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Đang trả lời...
                  </div>
                )}
              </div>
              <form onSubmit={submitChatMessage} className="mt-3 flex items-center gap-2 rounded-full border border-skyPastel/80 bg-white px-3 py-2 shadow-button">
                <input
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  placeholder="Nhập tin nhắn..."
                  className="min-w-0 flex-1 bg-transparent text-xs font-bold text-navySoft outline-none placeholder:text-navyMuted/70"
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-navySoft text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Gửi tin nhắn"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
        <button type="button" aria-label="Mở chatbot SmartCart" onClick={toggleChatBubble}>
          <BunnyMascot className="h-32 w-32 scale-105 sm:h-40 sm:w-40 md:h-56 md:w-56 xl:h-60 xl:w-60 xl:scale-110" cart={false} />
        </button>
      </motion.div>
      <ProductDetailModal product={selectedProduct} open={Boolean(selectedProduct)} onClose={() => setSelectedProduct(null)} />
    </section>
  );
}

function ChatBubbleMessage({
  message,
  onLoginAction,
  onPromptAction,
  onProductAction
}: {
  message: ChatMessage;
  onLoginAction?: () => void;
  onPromptAction?: (message: string) => void;
  onProductAction?: (productId: string) => void;
}) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex flex-col gap-1.5", isUser ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-[88%] whitespace-pre-line rounded-2xl px-3 py-2 text-xs font-bold leading-5",
          isUser ? "bg-navySoft text-white" : "bg-skyPastel/75 text-navySoft"
        )}
      >
        {message.content}
      </div>
      {!isUser && Boolean(message.actions?.length) && (
        <div className="flex max-w-[92%] flex-wrap gap-1.5">
          {message.actions?.map((action) =>
            action.type === "login" ? (
              <button
                key={`${action.label}-${action.href}`}
                type="button"
                onClick={onLoginAction}
                className="rounded-full border border-skyPastel/90 bg-white px-2.5 py-1 text-[0.68rem] font-black text-navySoft shadow-button transition hover:-translate-y-0.5 hover:bg-skyPastel/35"
              >
                {action.label}
              </button>
            ) : action.type === "prompt" ? (
              <button
                key={`${action.label}-${action.href}`}
                type="button"
                onClick={() => onPromptAction?.(action.href)}
                className="rounded-full border border-skyPastel/90 bg-white px-2.5 py-1 text-[0.68rem] font-black text-navySoft shadow-button transition hover:-translate-y-0.5 hover:bg-skyPastel/35"
              >
                {action.label}
              </button>
            ) : action.type === "product" ? (
              <button
                key={`${action.label}-${action.href}`}
                type="button"
                onClick={() => onProductAction?.(action.href)}
                className="rounded-full border border-skyPastel/90 bg-white px-2.5 py-1 text-[0.68rem] font-black text-navySoft shadow-button transition hover:-translate-y-0.5 hover:bg-skyPastel/35"
              >
                {action.label}
              </button>
            ) : (
              <Link
                key={`${action.label}-${action.href}`}
                href={action.href}
                className="rounded-full border border-skyPastel/90 bg-white px-2.5 py-1 text-[0.68rem] font-black text-navySoft shadow-button transition hover:-translate-y-0.5 hover:bg-skyPastel/35"
              >
                {action.label}
              </Link>
            )
          )}
        </div>
      )}
    </div>
  );
}

function PastelMarket() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-x-0 bottom-0 h-40 bg-mint" />
      <Image src="/images/house-transparent.png" alt="" width={340} height={260} className="absolute bottom-24 left-[4%] w-44 drop-shadow-2xl md:w-60" />
      <Image src="/images/house-transparent.png" alt="" width={340} height={260} className="absolute bottom-28 right-[3%] hidden w-48 drop-shadow-2xl lg:block" />
      {decorativeTrees.map((tree, index) => (
        <Image
          key={`${tree.src}-${index}`}
          src={tree.src}
          alt=""
          width={120}
          height={180}
          className={`absolute h-auto drop-shadow-2xl ${tree.className}`}
        />
      ))}
    </div>
  );
}
