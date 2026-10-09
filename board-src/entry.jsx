// The board island: React + Excalidraw bundled once, exposed to the plain-JS map as window.EdrBoardLib.
// board.js (vanilla) owns everything around it — loading, saving, versions, photos, links, templates.
import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Excalidraw, MainMenu, WelcomeScreen, exportToBlob, exportToSvg, serializeAsJSON, convertToExcalidrawElements, restoreElements, getSceneVersion, THEME } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";

function Board({ opts, expose }) {
  const [api, setApi] = useState(null);
  useEffect(() => { if (api) expose(api); }, [api]);
  return (
    <Excalidraw
      excalidrawAPI={setApi}
      initialData={opts.initialData}
      langCode={opts.lang || "pt-PT"}
      theme={opts.theme || THEME.LIGHT}
      viewModeEnabled={!!opts.viewMode}
      name={opts.name || "Quadro"}
      onChange={(els, st, files) => opts.onChange && opts.onChange(els, st, files)}
      onLinkOpen={(el, ev) => { if (opts.onLinkOpen) { ev.preventDefault(); opts.onLinkOpen(el.link, el); } }}
      UIOptions={{ canvasActions: { loadScene: false, saveToActiveFile: false, export: { saveFileToDisk: true }, toggleTheme: false, clearCanvas: !opts.viewMode }, tools: { image: true } }}
      renderTopRightUI={opts.renderTopRightUI ? () => <div ref={n => { if (n && !n.firstChild) n.appendChild(opts.renderTopRightUI()); }} /> : undefined}>
      <MainMenu>
        <MainMenu.DefaultItems.Export />
        <MainMenu.DefaultItems.SaveAsImage />
        <MainMenu.DefaultItems.Help />
        <MainMenu.Separator />
        <MainMenu.DefaultItems.ChangeCanvasBackground />
      </MainMenu>
      <WelcomeScreen>
        <WelcomeScreen.Center>
          <WelcomeScreen.Center.Heading>{opts.welcomeTitle || "Quadro"}</WelcomeScreen.Center.Heading>
          <WelcomeScreen.Hints.ToolbarHint />
        </WelcomeScreen.Center>
      </WelcomeScreen>
    </Excalidraw>
  );
}

function mount(container, opts) {
  const root = createRoot(container); let api = null; const waiters = [];
  root.render(<Board opts={opts} expose={a => { api = a; waiters.splice(0).forEach(w => w(a)); }} />);
  return {
    ready: () => api ? Promise.resolve(api) : new Promise(r => waiters.push(r)),
    api: () => api,
    unmount: () => root.unmount(),
  };
}

window.EdrBoardLib = { mount, exportToBlob, exportToSvg, serializeAsJSON, convertToExcalidrawElements, restoreElements, getSceneVersion, THEME, React };
