import React, {useState} from 'react';
import Page from 'page';
import style from './index.css';
import {Input, InputConfig} from './input';
import {TextAreaConfig} from './textarea';
import {Radio, RadioConfig} from './radio';
import ReportConfig from './report';

const loadData = (key, defaultValue) => (localStorage[key] ? JSON.parse(localStorage[key]) : defaultValue);

export default function Editor() {
    const [configs, setConfigs] = useState(loadData('configs', []));
    const [currentConfig, setCurrentConfig] = useState({});
    const [reportConfig, setReportConfig] = useState(loadData('reportConfig', {}));
    const [isInsertMode, setIsInsertMode] = useState(false);

    // 持久化数据
    const persistenceConfigs = configs => {
        return new Promise(resolve => {
            localStorage.configs = JSON.stringify(configs);
            resolve(configs);
        });
    };

    /******************************************* 组件渲染 *******************************************/
    const addComponent = type => {
        let index = configs.length;

        if (isInsertMode) {
            index = configs.findIndex(config => config.id === currentConfig.id);
        }

        configs.splice(index, 0, {
            type,
            id: Math.random()
                .toString(36)
                .substr(2)
        });

        persistenceConfigs(configs.slice(0, configs.length)).then(setConfigs);

        setIsInsertMode(false);
    };

    const deleteComponent = id => persistenceConfigs(configs.filter(config => config.id !== id)).then(setConfigs);

    const renderComponent = config => {
        const {id, type} = config;
        config.isActive = currentConfig.id === id;

        switch (type) {
            case 'input':
                return (
                    <Input
                        key={id}
                        config={config}
                        updateConfig={updateConfig}
                        handleClick={e => e.stopPropagation() + showConfig(id)}
                        handleDelete={e => deleteComponent(id)}
                        handleInsertBefore={e => setIsInsertMode(true)}
                    />
                );
            case 'radio':
                return (
                    <Radio
                        key={id}
                        config={config}
                        updateConfig={updateConfig}
                        handleClick={e => e.stopPropagation() + showConfig(id)}
                    />
                );
            default:
                break;
        }
    };

    /******************************************* 配置更新 *******************************************/
    const renderConfig = () => {
        const {type} = currentConfig;

        const ConfigComponent = {input: InputConfig, textarea: TextAreaConfig, radio: RadioConfig}[type];

        return ConfigComponent ? (
            <ConfigComponent config={currentConfig} updateConfig={updateConfig} />
        ) : (
            <ReportConfig config={reportConfig} updateConfig={updateReportConfig} />
        );
    };

    const updateReportConfig = config => {
        setReportConfig(config);
        localStorage.reportConfig = JSON.stringify(config);
    };

    const showConfig = id => setCurrentConfig(configs.find(o => o.id === id));

    const updateConfig = config => {
        const index = configs.findIndex(o => o.id === config.id);
        configs.splice(index, 1, config);
        setConfigs(configs);
        setCurrentConfig(config);
        persistenceConfigs(configs);
    };

    return (
        <Page>
            <div className={style.operation}>
                <span className={style.item} onClick={e => addComponent('input')}>
                    输入框
                </span>
                <span className={style.item} onClick={e => addComponent('radio')}>
                    不支持编辑的单选
                </span>
                <span className={style.item} onClick={e => addComponent('textarea')}>
                    多行输入框
                </span>
            </div>
            <div className={style.content} onClick={e => setCurrentConfig({})}>
                {configs.map(renderComponent)}
                <span
                    className={style.clear}
                    onClick={e => {
                        localStorage.configs = '[]';
                        setConfigs([]);
                    }}
                >
                    清空
                </span>

                <span className={style.save} onClick={e => console.table(configs) + console.log(reportConfig)}>
                    保存
                </span>
            </div>
            <div className={style.config}>{renderConfig()}</div>
        </Page>
    );
}
