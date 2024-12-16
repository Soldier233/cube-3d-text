import * as THREE from "three";
import { TextMaterialOption, TextMaterials } from "../types/text";

// 生成渐变纹理
const createGradientTexture = (
    colorGradualStart: string,
    colorGradualEnd: string,
    repeat: number,
    offset: number
): THREE.Texture => {
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d")!;

    // 创建线性渐变，从顶部到底部
    const gradient = context.createLinearGradient(0, 0, 0, size);
    gradient.addColorStop(0, colorGradualStart);
    gradient.addColorStop(1, colorGradualEnd);

    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace; // 设置编码为 sRGB
    texture.needsUpdate = true;

    // 计算文本高度
    // const textHeight = maxY - minY;

    // 计算纹理在 Y 方向上的重复次数
    // const repeatY = (textHeight / size) * 1.5;

    texture.repeat.set(1, repeat);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    // 计算偏移量，使纹理居中
    // const offsetY = -((repeatY - 1) / 2);
    texture.offset.set(0, offset);

    return texture;
};

export const createMeshStandardMaterialFromOption = (
    option: TextMaterialOption,
    reverseGradient: boolean = false,
    extra: { [key: string]: any } = {}
) : THREE.MeshStandardMaterial => {
    const roughness = 1.0;  // 粗糙度
    if (option.mode == 'color') {
        return new THREE.MeshStandardMaterial({ color: option.color, roughness, ...extra });
    } else if (option.mode == 'gradient') {
        return new THREE.MeshStandardMaterial({ map: createGradientTexture(
                reverseGradient ? option.colorGradualEnd : option.colorGradualStart,
                reverseGradient ? option.colorGradualStart: option.colorGradualEnd,
                option.repeat,
                option.offset
            ), roughness, ...extra });
    } else {
        // TODO
        return new THREE.MeshStandardMaterial({ color: "#FF0000", roughness, ...extra });
    }
}

export const createMeshBasicMaterialFromOption = (
    option: TextMaterialOption,
    reverseGradient: boolean = false,
    extra: { [key: string]: any } = {}
) : THREE.MeshBasicMaterial => {
    if (option.mode == 'color') {
        return new THREE.MeshBasicMaterial({ color: option.color, ...extra });
    } else if (option.mode == 'gradient') {
        return new THREE.MeshBasicMaterial({ map: createGradientTexture(
                reverseGradient ? option.colorGradualEnd : option.colorGradualStart,
                reverseGradient ? option.colorGradualStart: option.colorGradualEnd,
                option.repeat,
                option.offset
            ), ...extra });
    } else if (option.mode === 'image') {
        const texture = new THREE.TextureLoader().load(option.image);
        // 根据需求设置 wrap 模式与 repeat、offset 等
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(option.repeat, option.repeat);
        texture.offset.set(0, option.offset);

        return new THREE.MeshBasicMaterial({
            map: texture,
            ...extra
        });
    } else {
        // 默认材质（fallback）
        return new THREE.MeshBasicMaterial({ color: "#FF0000", ...extra });
    }
}

// 创建立方体贴图材质
export const createCubeMaterial = (
    materials: TextMaterials
): THREE.Material[] => {
    return [
        createMeshBasicMaterialFromOption(materials.right), // 右面
        createMeshBasicMaterialFromOption(materials.left), // 左面
        createMeshBasicMaterialFromOption(materials.up), // 上面
        createMeshBasicMaterialFromOption(materials.down, true), // 下面
        createMeshBasicMaterialFromOption(materials.front), // 前面
        createMeshBasicMaterialFromOption(materials.back), // 后面
    ];
};