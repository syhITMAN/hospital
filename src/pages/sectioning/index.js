import React, { useState, useEffect, useRef } from 'react';
import style from './index.css';
import { api, userInfo, getCaseRecords, changeDate, handleSearch } from 'utils';
import PublicComp from 'workstation';
import Message from 'message';
import confirm from 'confirm';
import { CODE } from 'myConstants';
import Page from 'page';

const texts = require('./lan/zh.js');

export default function Index(props) {
    const columns = [
        {
            title: '任务来源',
            dataIndex: 'task_src',
            render: value => texts.source[value],
        },
        {
            title: '姓名',
            dataIndex: 'name',
        },
        {
            title: '病理号',
            dataIndex: 'pathnum',
        },
        {
            title: '蜡块号',
            dataIndex: 'paraffin_num',
        },
        {
            title: '切片号',
            dataIndex: 'slice_id',
        },
        {
            title: '染色方式',
            dataIndex: 'dye_type',
            render: value => texts.sectionType[value],
        },

        {
            title: '标本类型',
            dataIndex: 'sample_type',
            render: value => texts.sampleType[value],
            filters: [
                {
                    text: '大标本',
                    value: 0,
                },
                {
                    text: '小标本',
                    value: 1,
                },
            ],
        },
        {
            title: '组织名称',
            dataIndex: 'tissue',
        },
        {
            title: '申请医生',
            dataIndex: 'apply_doc',
        },
        {
            title: '包埋时间',
            dataIndex: 'embed_time',
        },
        {
            title: ' 制片技师',
            dataIndex: 'slice_tech',
        },
        {
            title: '制片时间',
            dataIndex: 'slice_time',
        },
        {
            title: '标签打印状态',
            dataIndex: 'tag_printed',
            render: value => texts.tagPrint[value],
        },
        {
            title: '工作单打印状态',
            dataIndex: 'sheet_printed',
            render: value => texts.sheetPrint[value],
        },

        {
            title: '制片状态',
            dataIndex: 'status',
            render: value => (
                <React.Fragment>
                    <span
                        className={style.dot}
                        style={{
                            background: { 1: '#6FC831', 0: '#F4BB00' }[value],
                        }}
                    />
                    {texts.status[value]}
                </React.Fragment>
            ),
            filters: [
                {
                    text: '待制片',
                    value: 0,
                },
                {
                    text: '已制片',
                    value: 1,
                },
            ],
        },
        {
            title: '备注',
            dataIndex: 'comment',
        },
    ].map(column => {
        column.width = 120;
        return column;
    });
    const word = {
        rowkey: 'slice_id',
        name: '制片列表',
        timeText: '包埋日期：',
        inputText: '切片号：',
        total: '切片数总计',
        unaccomplished: '待制片',
        finishText: '完成制片',
        printTab: '打印标签',
        printSheet: '打印工作单',
    };

    const paraffinListLength = useRef();
    const paraffinList = useRef();
    const [waxId, setWaxId] = useState([]);

    const [dateRange, setDateRange] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [searchList, setSearchList] = useState([]);
    const [filters, setFilters] = useState({});

    useEffect(() => {
        const init = async e => {
            paraffinList.current = await getCaseRecords('records/search_slice', { type: 'slice' }, 'status');
            paraffinListLength.current = paraffinList.current.length;
            setSearchList(paraffinList.current);
        };
        init();
    }, []);

    const finish = () => {
        if (!waxId.length) return;
        confirm({
            content: '确认完成制片？',
            onOk: e => {
                api('records/accomplish_slice', {
                    slice_id: JSON.stringify(waxId),
                    slice_tech: userInfo().name,
                }).then(data => {
                    if (CODE.SUCCESS === data.code) {
                        Message.success('制片成功');
                        setWaxId([]);
                        const reload = async e => {
                            paraffinList.current = await getCaseRecords(
                                'records/search_slice',
                                { type: 'slice' },
                                'status'
                            );
                            paraffinListLength.current = paraffinList.current.length;
                            setSearchList(
                                handleSearch(
                                    filters,
                                    dateRange,
                                    inputValue,
                                    paraffinList.current,
                                    'embed_time',
                                    'slice_id'
                                )
                            );
                        };
                        reload();
                    } else {
                        Message.error(data.message);
                    }
                });
            },
        });
    };

    return (
        <Page>
            <div className={style.outerbg}>
                {paraffinList.current && (
                    <PublicComp
                        paraffinListLength={paraffinListLength.current}
                        unFinishList={paraffinList.current.filter(o => o.status === 0).length}
                        searchList={searchList}
                        columns={columns}
                        word={word}
                        finish={finish}
                        waxId={waxId}
                        checkList={e => setWaxId(e)}
                        saveFilter={e => setFilters(e)}
                        filter={filters}
                        dateRange={dateRange}
                        changeTimeVal={e => setDateRange(changeDate(e))}
                        inputValue={inputValue}
                        changeInputVal={value => setInputValue(value)}
                        handleSearch={e =>
                            setSearchList(
                                handleSearch(e, dateRange, inputValue, paraffinList.current, 'embed_time', 'slice_id')
                            )
                        }
                    />
                )}
            </div>
        </Page>
    );
}