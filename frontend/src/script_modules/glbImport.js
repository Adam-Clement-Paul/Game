import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {loadingManager} from '../script_modules/init3DScene';


export const loadModel = (modelPath, callback) => {
    const loader = new GLTFLoader(loadingManager);
    loader.load(
        modelPath,
        function (gltf) {
            const model = gltf.scene;
            model.traverse((o) => {
                if (o.isMesh) {
                    /*o.castShadow = true;
                    o.receiveShadow = true;*/
                }
            });

            const animations = gltf.animations;

            if (callback) {
                callback(model, animations);
            }
        }
    );
};
