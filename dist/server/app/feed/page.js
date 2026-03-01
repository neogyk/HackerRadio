// Built: 2026-03-01T18:55:24.814Z
//#region \0virtual:/Users/leonid/Desktop/LinkedinRadio/src/app/feed/page.tsx
function registerClientReference(clientReference, id, exportName) {
	const key = id + "#" + exportName;
	const clientProxy = {};
	Object.defineProperty(clientProxy, "$$typeof", {
		value: Symbol.for("react.client.reference"),
		enumerable: false
	});
	Object.defineProperty(clientProxy, "$$id", {
		value: key,
		enumerable: false
	});
	Object.defineProperty(clientProxy, "$$async", {
		value: false,
		enumerable: false
	});
	try {
		if (typeof globalThis["~rari"]?.bridge !== "undefined" && typeof globalThis["~rari"].bridge.registerClientReference === "function") globalThis["~rari"].bridge.registerClientReference(key, id, exportName);
	} catch (error) {
		console.error("[rari] Build: Failed to register client reference with Rust bridge:", error);
	}
	return clientProxy;
}
const HNPostFeed = registerClientReference(null, "src/components/HNPostFeed.tsx", "HNPostFeed");
function FeedPage() {
	return /* @__PURE__ */ React.createElement("div", { className: "max-w-6xl mx-auto px-6 py-4" }, /* @__PURE__ */ React.createElement(HNPostFeed, null));
}

//#endregion
export { FeedPage as default };