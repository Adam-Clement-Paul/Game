import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
// import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';

export const loadModel = (modelPath, callback) => {
    const loader = new GLTFLoader();
    /*const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath( '../decoder/' );
    loader.setDRACOLoader( dracoLoader );*/
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
