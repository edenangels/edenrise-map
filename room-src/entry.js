// The 3D room island: three.js + Spark (World Labs, MIT) for Gaussian-splat scans, plus three's own glTF/USDZ loaders
// for mesh scans (Polycam, 3D Scanner App, Apple RoomPlan). Built once into ../vendor/spark/room3d.js and lazy-loaded
// by ../room.js only when someone opens a room — the map itself never pays for it.
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { USDZLoader } from "three/examples/jsm/loaders/USDZLoader.js";
import { SparkRenderer, SplatMesh, transcodeSpz, getSplatFileType } from "@sparkjsdev/spark";
window.EdrRoom3D = { THREE, OrbitControls, GLTFLoader, USDZLoader, SparkRenderer, SplatMesh, transcodeSpz, getSplatFileType };
