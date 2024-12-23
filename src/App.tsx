// src/App.tsx
import React, { useState, useRef, useEffect } from "react";
import { Layout, Flex, Form, Slider, Collapse, Button, ConfigProvider, Select, Dropdown, Space, Typography, MenuProps, Alert } from "antd";
import { AppstoreOutlined, BookOutlined, CameraOutlined, CompassOutlined,
    DeleteOutlined, GlobalOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { HappyProvider } from '@ant-design/happy-work-theme';
import ThreeCanvas, { ThreeCanvasHandle } from "./components/ThreeCanvas";
import "antd/dist/reset.css";
import { CameraOptions, Text3DData, WorkspaceData } from "./types/text";
import TextSettingsPanel from "./components/TextSettingsPanel.tsx";
import { materialGradientLightBlue, materialGradientMediumYellow } from "./presetMaterials.ts";
import { MessageProvider } from "./contexts/MessageContext";
import { useLanguage } from "./language.tsx";

const { Sider, Content } = Layout;
const { Panel } = Collapse;

// 字体映射
const fontsMap: { [name: string]: string } = {
    "REEJI Taiko Magic": "font/REEJI-TaikoMagicGB-Flash_Regular.json",
    "汉仪力量黑(简)": "font/HYLiLiangHeiJ_Regular.json",
    "Minecraft Ten": "font/Minecraft_Ten_Regular.json",
    "Fusion Pixel 8px": "font/Fusion_Pixel_8px_Proportional_zh_hans_Regular.json",
    "Fusion Pixel 10px": "font/Fusion_Pixel_10px_Proportional_zh_hans_Regular.json",
};

const App: React.FC = () => {
    const { language, setLanguage, gLang } = useLanguage();

    const [texts, setTexts] = useState<Text3DData[]>([
        {
            content: gLang('defaultText1'),
            opts: {
                size: 10,
                depth: 5,
                y: 8,
                rotY: 0,
                materials: materialGradientMediumYellow,
                outlineWidth: 0.4,
                letterSpacing: 1.0,
                spacingWidth: 0.2
            },
            position: [0, 0, 0],
            rotation: [0, 0, 0]
        },
        {
            content: gLang('defaultText2'),
            opts: {
                size: 5,
                depth: 3,
                y: -4,
                rotY: 0,
                materials: materialGradientLightBlue,
                outlineWidth: 0.5,
                letterSpacing: 1.5,
                spacingWidth: 0.2
            },
            position: [0, 0, 0],
            rotation: [0, 0, 0]
        }
    ]);

    const [cameraOptions, setCameraOptions] = useState<CameraOptions>({
        fov: 75
    });

    const [selectedFont, setSelectedFont] = useState(language === 'en_US' ? "Minecraft Ten" : "Fusion Pixel 10px"); // 当前选中的字体

    const [textPanelActiveKeys, setTextPanelActiveKeys] = useState<string[]>(['1']);

    const [lastWorkshop, setLastWorkshop] = useState<WorkspaceData | null>(null);

    // 创建一个引用来访问 ThreeCanvas 的截图和重置功能
    const threeCanvasRef = useRef<ThreeCanvasHandle>(null);

    const handleScreenshot = () => {
        if (threeCanvasRef.current) {
            threeCanvasRef.current.takeScreenshot();
        }
    };

    const handleOutputOption: MenuProps['onClick'] = (e) => {
        if (threeCanvasRef.current) {
            if (e.key === 'glb' || e.key === 'gltf' || e.key === 'obj' || e.key === 'stl') {
                threeCanvasRef.current.exportScene(e.key);
            }
        }
    };

    const handleResetCamera = () => {
        if (threeCanvasRef.current) {
            threeCanvasRef.current.resetCamera();
        }
    }

    // 自动加载工作区
    useEffect(() => {
        const workspaceStr = localStorage.getItem('workspace');
        if (workspaceStr) {
            const workspace: WorkspaceData = JSON.parse(workspaceStr);
            setLastWorkshop(workspace);
        }
    }, []);

    const [initTime] = useState<number>(Date.now());

    // 自动保存工作区
    useEffect(() => {
        const now = Date.now();
        // 只有在 5 秒后才会自动保存
        if (now - initTime < 5000) {
            return;
        }
        const workspace: WorkspaceData = {
            fontId: selectedFont,
            texts: texts
        };
        // 保存工作区数据
        localStorage.setItem('workspace', JSON.stringify(workspace));
        setLastWorkshop(null);
    }, [texts]);
    
    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: '#333333',
                },
                components: {
                    Button: {
                        primaryShadow: '0 2px 0 rgba(0, 0, 0, 0.08)'
                    },
                    Dropdown: {
                        controlItemBgActive: 'rgba(0, 0, 0, 0.12)',
                        controlItemBgActiveHover: 'rgba(0, 0, 0, 0.2)',
                    },
                    Select: {
                        optionSelectedBg: 'rgba(0, 0, 0, 0.12)',
                    },
                    Form: {
                        itemMarginBottom: 16
                    },
                },
            }}
        >
            <MessageProvider>
                <Layout style={{ height: "100vh" }}>
                    {/* 左侧配置面板 */}
                    <Sider width={300} style={{ background: "#F5F5F5", padding: 16, overflow: "auto", marginBottom: 16 }}>
                        <Flex vertical gap={"middle"} style={{ width: "100%" }}>
                            <Collapse defaultActiveKey={["camera"]} bordered={false} style={{ background: "white", boxShadow: "0 2px 16px rgba(0, 0, 0, 0.05)" }}>
                                <Panel header={gLang('cameraSettings')} key="camera">
                                    <Form.Item label={gLang('font')}>
                                        <Select
                                            value={selectedFont}
                                            onChange={(value) => setSelectedFont(value)}
                                            style={{ width: "100%" }}
                                        >
                                            {Object.keys(fontsMap).map((fontName) => (
                                                <Select.Option key={fontName} value={fontName}>
                                                    {fontName}
                                                </Select.Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                    <Form.Item label={gLang('perspective', {angle: cameraOptions.fov})} style={{ marginBottom: 0 }}>
                                        <Slider
                                            min={1}
                                            max={120}
                                            step={1}
                                            value={cameraOptions.fov}
                                            onChange={(val) => setCameraOptions({ ...cameraOptions, fov: val })}
                                        />
                                    </Form.Item>
                                </Panel>
                            </Collapse>
                            {texts.length > 0 &&
                                <Collapse activeKey={textPanelActiveKeys} onChange={setTextPanelActiveKeys} bordered={false} style={{ background: "white", boxShadow: "0 2px 16px rgba(0, 0, 0, 0.05)" }}>
                                    {texts.map((text, index) => (
                                        <Panel
                                            header={text.content ? text.content : gLang(`textPanelTitle`, { index: index + 1 })}
                                            key={index + 1}
                                            extra={
                                                <Flex style={{ height: 22, width: 22, marginTop: -2 }}>
                                                    <Button
                                                        type={"text"}
                                                        size={'small'}
                                                        style={{
                                                            height: 26,
                                                            width: 26,
                                                        }}
                                                        onClick={() => {
                                                            const newTexts = [...texts];
                                                            newTexts.splice(index, 1);
                                                            setTexts(newTexts);
                                                        }}
                                                    >
                                                        <DeleteOutlined style={{ opacity: 0.5 }} />
                                                    </Button>
                                                </Flex>
                                            }
                                        >
                                            <TextSettingsPanel
                                                text={text.content}
                                                textOptions={text.opts}
                                                onTextChange={(newText) => {
                                                    const newTexts = [...texts];
                                                    newTexts[index].content = newText;
                                                    setTexts(newTexts);
                                                }}
                                                onTextOptionsChange={(newOptions) => {
                                                    const newTexts = [...texts];
                                                    newTexts[index].opts = newOptions;
                                                    setTexts(newTexts);
                                                }}
                                            />
                                        </Panel>
                                    ))}
                                </Collapse>
                            }
                            <Button
                                type="dashed"
                                icon={<PlusOutlined />}
                                onClick={() => {
                                    setTexts([
                                        ...texts,
                                        {
                                            content: 'New Text',
                                            opts: {
                                                size: 5,
                                                depth: 3,
                                                y: texts.length * -6,
                                                rotY: 0,
                                                materials: materialGradientLightBlue,
                                                outlineWidth: 0.5,
                                                letterSpacing: 1.5,
                                                spacingWidth: 0.2
                                            },
                                            position: [0, 0, 0],
                                            rotation: [0, 0, 0]
                                        }
                                    ]);
                                    setTextPanelActiveKeys([(texts.length + 1).toString()]);
                                }}
                            >
                                {gLang('addText')}
                            </Button>
                        </Flex>
                    </Sider>
                    {/* 右侧 3D 场景 */}
                    <Content style={{ position: "relative" }}>
                        <ThreeCanvas
                            ref={threeCanvasRef}
                            cameraOptions={cameraOptions}
                            texts={texts}
                            fontUrl={fontsMap[selectedFont]}
                        />
                        {/* 添加截图按钮 */}
                        <Flex gap={"small"} style={{ position: "absolute", top: 20, right: 20, zIndex: 1 }}>
                            <Button
                                type="default"
                                icon={<ReloadOutlined />}
                                onClick={handleResetCamera}
                            >
                                {gLang('resetCamera')}
                            </Button>
                            <HappyProvider>
                                <Dropdown.Button
                                    type="primary"
                                    menu={{
                                        items: [
                                            {
                                                key: 'glb',
                                                label: gLang('output.glb'),
                                                icon: <AppstoreOutlined />
                                            },
                                            // {
                                            //     key: 'gltf',
                                            //     label: gLang('output.gltf'),
                                            //     icon: <AppstoreOutlined />
                                            // },
                                            {
                                                key: 'obj',
                                                label: gLang('output.obj'),
                                                icon: <BookOutlined />
                                            },
                                            {
                                                key: 'stl',
                                                label: gLang('output.stl'),
                                                icon: <CompassOutlined />
                                            },
                                        ],
                                        onClick: handleOutputOption
                                    }}
                                    onClick={handleScreenshot}
                                >
                                    <CameraOutlined />
                                    {gLang('screenshot')}
                                </Dropdown.Button>
                            </HappyProvider>

                        </Flex>

                        {/* 右小角悬浮 */}
                        <Flex style={{ position: "absolute", bottom: 8, right: 8, zIndex: 1 }}>
                            <Dropdown
                                menu={{
                                    items: [
                                        { key: 'zh_CN', label: gLang('zh_CN') },
                                        { key: 'en_US', label: gLang('en_US') },
                                        { key: 'ja_JP', label: gLang('ja_JP') },
                                    ],
                                    selectable: true,
                                    defaultSelectedKeys: [language],
                                    onSelect: ({ key }) => setLanguage(key)
                                }}
                            >
                                <Button type={'text'}>
                                    <Typography.Text type={'secondary'}>
                                        <Space size={'small'}>
                                            <GlobalOutlined />
                                            {gLang(language)}
                                        </Space>
                                    </Typography.Text>
                                </Button>
                            </Dropdown>
                        </Flex>

                        {/*顶部悬浮*/}
                        <Flex style={{ position: "absolute", top: 8, zIndex: 1, width: "100%" }} justify={'center'}>
                            {lastWorkshop && (
                                <Alert
                                    message={gLang('lastSaved.message', { count: lastWorkshop.texts.length })}
                                    type="info"
                                    showIcon
                                    action={
                                        <Space size={0} style={{ marginLeft: 12 }}>
                                            <Button
                                                size="small"
                                                type="text"
                                                style={{ paddingLeft: 4, paddingRight: 4 }}
                                                onClick={() => {
                                                    setLastWorkshop(null);
                                                    localStorage.removeItem('workspace');
                                                }}
                                            >
                                                {gLang('lastSaved.delete')}
                                            </Button>
                                            <Button
                                                size="small"
                                                type="link"
                                                style={{ paddingLeft: 4, paddingRight: 4 }}
                                                onClick={() => {
                                                    setSelectedFont(lastWorkshop.fontId);
                                                    setTexts(lastWorkshop.texts);
                                                    setLastWorkshop(null);
                                                }}
                                            >
                                                {gLang('lastSaved.apply')}
                                            </Button>
                                        </Space>
                                    }
                                    closable
                                />
                            )}
                        </Flex>
                    </Content>
                </Layout>
            </MessageProvider>
        </ConfigProvider>
    );
};

export default App;