// src/components/Text3D.tsx
import { forwardRef, useMemo } from "react";
import * as THREE from "three";
import { Font } from "three/examples/jsm/loaders/FontLoader.js";
import { TextOptions } from "../types/text";
import { createCubeMaterial } from "../utils/textMaterial.ts";
import { createSpacedTextGeometry } from "../utils/createSpacedTextGeometry.ts";

interface Text3DProps {
    content: string;
    opts: TextOptions;
    font: Font;
    position: [number, number, number];
    // 其他props...
}

const Text3D = forwardRef<THREE.Group, Text3DProps>(({
                                                         content,
                                                         opts,
                                                         font,
                                                         position,
                                                         // 其他props...
                                                     }, ref) => {

    // 创建带有字间距的文字几何体
    const geometry = useMemo(() => {
        const letterSpacing = opts.letterSpacing || 0;
        return createSpacedTextGeometry({
            text: content,
            font,
            size: opts.size,
            height: opts.depth,
            curveSegments: 12,
            bevelEnabled: false,
            letterSpacing
        });
    }, [content, opts.size, opts.depth, font, opts.letterSpacing]);

    // 获取文字几何体的高度
    const boundingBox = new THREE.Box3().setFromObject(new THREE.Mesh(geometry));
    const yMin = boundingBox.min.y;
    const yMax = boundingBox.max.y;

    // 创建文字材质
    const textMaterial = useMemo(() =>
        createCubeMaterial(
            opts.colorGradualStart,
            opts.colorGradualEnd,
            opts.colorSide,
            opts.colorBottomStart,
            opts.colorBottomEnd
        ),
        [opts.colorGradualStart, opts.colorGradualEnd, opts.colorSide, yMin, yMax]
    );

    // 分组几何体
    useMemo(() => {
        const positionAttribute = geometry.getAttribute('position') as THREE.BufferAttribute;
        const normalAttribute = geometry.getAttribute('normal') as THREE.BufferAttribute;

        const groups = [];
        for (let i = 0; i < positionAttribute.count; i += 3) {
            const normal = new THREE.Vector3(
                normalAttribute.getX(i),
                normalAttribute.getY(i),
                normalAttribute.getZ(i)
            ).normalize();

            let groupIndex = 4; // 默认前后面

            // 根据法线方向分配组索引
            if (Math.abs(normal.x) > 0.8) {
                groupIndex = normal.x > 0 ? 0 : 1; // 右面或左面
            } else if (Math.abs(normal.y) > 0.5) {
                groupIndex = normal.y > 0 ? 2 : 3; // 上面或下面
            }

            groups.push({
                start: i,
                count: 3,
                materialIndex: groupIndex
            });
        }

        // 清现有组
        while (geometry.groups.length > 0) {
            geometry.groups.pop();
        }

        // 添加新组
        groups.forEach(group => geometry.addGroup(group.start, group.count, group.materialIndex));

    }, [geometry]);

    // 创建主网格
    const mainMesh = useMemo(() => new THREE.Mesh(geometry, textMaterial), [geometry, textMaterial]);

    // 创建一个组包含主网格
    const group = useMemo(() => {
        const grp = new THREE.Group();
        grp.add(mainMesh);
        grp.position.set(...position);
        return grp;
    }, [mainMesh, position]);

    return <primitive object={group} ref={ref} />;
});

export default Text3D;