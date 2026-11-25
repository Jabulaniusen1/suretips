import Script from "next/script";

const GA_ID_RE = /^G-[A-Z0-9]{4,}$/;

/** Google Analytics 4 -- only rendered when NEXT_PUBLIC_GA_ID is a valid id. */
export function GoogleAnalytics() {
  const id = process.env.NEXT_PUBLIC_GA_ID;
  if (!id || !GA_ID_RE.test(id)) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}',{anonymize_ip:true});`}
      </Script>
    </>
  );
}
