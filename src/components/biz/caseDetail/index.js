import React, { useState, useRef,useCallback ,useEffect} from 'react';
import style from './index.css';
import Material from 'paraffin';
import Application from 'application';
import Patient from 'patient';
import Advices from './advices';
import deep from 'deep';
import confirm from 'confirm';
import { api } from 'utils';
import Message from 'message';
import Transition from 'transition';
import Tabs from 'tabs';
import { CODE } from 'myConstants';

const APPLY_INFO = 0;
//const PRE_WAX_LIST = 1;
const WAX_LIST = 2;
const tabList = [{ type: '申请信息', value: 0 }, { type: '预处理记录', value: 1 }, { type: '取材记录', value: 2 }];
export default function Index(props) {
    const [curCompnent, setCurCompnent] = useState(2);
    const [curList, setCurList] = useState({
        doctor: 'A',
        source: 0,
        sample_type: '',
        name: '',
        quantity: 1,
        remark: '',
        paraffin_num: '',
        editable: 1,
    });

    const curWax = useRef({ record: props.wax.record, seen: props.wax.seen });
    

    const changeCurList = (e, type) => {
        let changeList = Object.assign({}, curList, {
            [type]: e.target ? e.target.value : e,
        });
        setCurList(changeList);
    };

    const switchChildren = cur => {
        setCurCompnent(cur);
    };
    const close = () => {
        let propsWax = Object.assign({}, { record: props.wax.record, seen: props.wax.seen });
        const changed = !deep.equals(curWax.current, propsWax);
        const { closeDetail } = props;
        if (changed) {
            confirm({ onNotSave: closeDetail, onSave: e => save(closeDetail, 0), type: 'close' });
        } else {
            closeDetail();
        }
    };
    const save = (callback, accomplish) => {
        const { wax, pathnum } = props;
        let record = {
            pathnum: pathnum,
            seen: wax.seen ? wax.seen.trim() : wax.seen,
            record: wax.record,
            accomplish: accomplish,
        };
        api('records/save_case', { record: JSON.stringify(record) }).then(data => {
            if (CODE.SUCCESS === data.code) {
                if (callback || callback === 1) {
                    callback();
                } else {
                    curWax.current = Object.assign({}, { record: props.wax.record, seen: props.wax.seen });
                    Message.success('保存成功');
                }
            } else {
                Message.error(data.message);
            }
        });
    };

    const { wax, handleSeenChange, add, deleteWax, appli, pathnum, editable, multiClick, closeDetail,showAddParaffin ,changeAddParaffin} = props;

    const [adviceList, setAdviceList] = useState([]);
    const list = useCallback(() => {
        api(`order/get_tech_orders_detail`, {
            filter: JSON.stringify([1, 2]),
            pathnum:pathnum,
        }).then(({ code, data }) => {
            if (CODE.SUCCESS === code) {
                setAdviceList(data);
            }
        });
    }, [pathnum]);

    useEffect(() => {
        list();
    }, [list]);    


    let height = '';
    if(curCompnent === WAX_LIST && adviceList.length) height='calc(100% - 335px)';
    if(curCompnent === WAX_LIST && !adviceList.length) height='calc(100% - 140px)';
    if(curCompnent === WAX_LIST && adviceList.length===1) height='calc(100% - 268px)';
    if(curCompnent === WAX_LIST && adviceList.length===2) height='calc(100% - 304px)';
    
    return (
        <Transition>
            <div className={style.detail}>
                <div className={style.top}>
                    取材
                    <img src={require('@images/close.png')} alt="关闭" onClick={close} width="20" />
                </div>
                {curCompnent === WAX_LIST && (
                    <div className={style.patient}>
                        <Patient pathnum={pathnum} id={appli.basicMessage.identify_id} />
                    </div>
                )}
                {curCompnent === WAX_LIST && adviceList.length>0 && (
                    <div className={style.advice}>
                        <Advices adviceList={adviceList} />
                    </div>                   
                )}
                <div className={style.wrap} style={{height:height}}>
                    <Tabs curCompnent={curCompnent} tabList={tabList} switchChildren={switchChildren}>
                        {curCompnent === WAX_LIST && (
                            <Material
                                curList={editable ? curList : null}
                                changeCurList={editable ? changeCurList : e => e}
                                wax={wax}
                                handleSeenChange={editable ? handleSeenChange : e => e}
                                add={editable ? add : e => e}
                                deleteWax={deleteWax}
                                editable={editable}
                                multiClick={multiClick}
                                save={save}
                                finish={closeDetail}
                                showAddParaffin={showAddParaffin}
                                changeAddParaffin={e=>changeAddParaffin(e)}
                            />
                        )}
                        {curCompnent === APPLY_INFO && <Application appli={appli} />}
                    </Tabs>
                </div>
            </div>
        </Transition>
    );
}
