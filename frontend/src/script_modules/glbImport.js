import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

export const loadModel = (modelPath, callback) => {
    const loader = new GLTFLoader();
    loader.load(
        modelPath,
        function (gltf) {
            const model = gltf.scene;
            model.traverse((o) => {
                if (o.isMesh) {
                    o.castShadow = true;
                    o.receiveShadow = true;
                }
            });

            if (callback) {
                callback(model);
            }
        }
    );
};