import React, { useState, useEffect } from 'react';
import Page from 'page';
import style from './index.css';
import Table from 'table';
import Input from 'input';
import Detail from 'caseDetail';
import { api, userInfo, fmtDate } from 'utils';
import confirm from 'confirm';
import Message from 'message';
import { CODE } from 'myConstants';

const texts = require('./lan/zh.js');

export default function Index() {	
	
	const columns = [
		{
			title: '病理号',
			dataIndex: 'pathnum',
			width: 120,
		},
		{
			title: '姓名',
			dataIndex: 'name',
			width: 120,
		},
		{
			title: '性别',
			dataIndex: 'gender',
			render: value => texts.gender[value],
			width: 100,
		},
		{
			title: '年龄',
			dataIndex: 'age',
			width: 100,
		},
		{
			title: '临床诊断',
			dataIndex: 'clinical_diagnosis',
			
		},
		{
			title: '申请类别',
			dataIndex: 'apply_type',
			render: value => texts.applyType[value],
			width: 110,
		},
		{
			title: '手术名称',
			dataIndex: 'surgery_name',
			width: 140,
		},
		{
			title: ' 接收时间',
			dataIndex: 'receive_time',
			width: 200,
		},
		{
			title: '患者来源',
			dataIndex: 'source',
			render: value => texts.source[value],
			width: 120,
		},
		{
			title: '住院号',
			dataIndex: 'admission_num',
			width: 120,
		},
		{
			title: '门诊号',
			dataIndex: 'outpatient_num',
			width: 120,
		},
		{
			title: '送检科室',
			dataIndex: 'deliver_did',
			width: 120,
		},
		{
			title: '送检医生',
			dataIndex: 'deliver_doc',
			width: 120,
		},
		{
			title: '状态',
			dataIndex: 'status',
			width: 110,
			render: value => (
				<React.Fragment>
					<span
						className={style.dot}
						style={{
							background: { 2: '#F45E00', 0: '#f4bb00' }[value],
						}}
					/>
					{texts.status[value]}
				</React.Fragment>
			),
		},
		{
			title: '操作',
			dataIndex: 'option',
			fixed: 'right',
			width: 80,
			render: (text, record) => (
				<React.Fragment>
					<span onClick={e => openCaseDetail(record.pathnum, record.case_id)} className={style.updateBtn}>
						{text === 0 ? '重取' : '取材'}
					</span>
				</React.Fragment>
			),
		},
	];
	const [caseList, setCaseList] = useState([]);
	const [showDetail, setShowDetail] = useState(false);
	const [pathnum, setPathnum] = useState(null);
	const [waxMessage, setWaxMessage] = useState({});
	const [applyMessage, setApplyMessage] = useState({});
	const [searchNum, setSearchNum] = useState('');
	const [multiClick, setMultiClick] = useState(true);
	const [showAddParaffin,setShowAddParaffin]=useState(false);

	useEffect(() => getCaseRecords(), []);
	const getCaseRecords = () => {
		api('records/search_case', {
			status: JSON.stringify([0, 2]),
		}).then(({ code, data }) => {
			if (CODE.SUCCESS === code) {
				setCaseList(data.case_info);
			}
		});
	};

	const openCaseDetail = pathnum => {
		if(!pathnum) return
		api('records/get_case', { pathnum: pathnum.trim() }).then(data => {
			if (CODE.SUCCESS === data.code) {
				setWaxMessage(data.data);
				setPathnum(pathnum);

				api('records/get_appli', { pis_apply_id: data.data.pis_apply_id }).then(({ code, data }) => {
					if (CODE.SUCCESS === code) {
						setApplyMessage(data);
						setShowDetail(true);
					}
				});
			} else {
				Message.error(data.message);
			}
		});
	};

	const closeDetail = () => {
		setShowDetail(false);
		getCaseRecords();
	};

	const handleSeenChange = (e, type,common) => {
		let changeSeenValue = Object.assign({}, waxMessage, {
			[type]: e.target ? e.target.value :(common ? ( waxMessage.seen ? waxMessage.seen+e:e):e),
		});
		setWaxMessage(changeSeenValue);
	};

	const add = wax => {
		setMultiClick(false);
		let curwax = Object.assign({}, wax);
		curwax.recorder = userInfo().username;
		curwax.pathnum = pathnum;
		curwax.receive_time = fmtDate(new Date());
		curwax.paraffin_num = pathnum + String.fromCharCode(waxMessage.waxList.length + 65);
		for (let key in curwax) {
			if (curwax[key] && isNaN(curwax[key])) curwax[key] = curwax[key].trim();
		}
		api('records/add_paraffin', curwax).then(({ code, data }) => {
			if (CODE.SUCCESS === code) {
				curwax.paraffin_id = data.paraffin_id;
				curwax.recorder = userInfo().name;
				let waxList = Object.assign({}, waxMessage, {
					waxList: [...waxMessage.waxList, curwax],
				});
				setWaxMessage(waxList);
				setMultiClick(true);
				setShowAddParaffin(false)
			}
		});
	};

	const deleteWax = (index, id) => {
		confirm({
			content: '确认删除吗?',
			onOk: e => {
				api('records/del_paraffin', { paraffin_id: id }).then(data => {
					if (CODE.SUCCESS === data.code) {
						let list = [...waxMessage.waxList];
						list.splice(index, 1);
						list.forEach((o, index) => {
							o.paraffin_num = pathnum + String.fromCharCode(index + 65);
						});
						let changelist = Object.assign({}, waxMessage, {
							waxList: list,
						});
						setWaxMessage(changelist);
					} else {
						Message.error(data.message);
					}
				});
			},
		});
	};

	const handleKeyDown = e => {
		if (e.keyCode === 13) {
			openCaseDetail(searchNum);
		}
	};

	const aflterFilterData = () => {
		if (searchNum) {
			return caseList.filter(o => o.pathnum.toLowerCase().indexOf(searchNum.toLowerCase()) >= 0);
		} else {
			return caseList;
		}
	};
	return (
		<Page>
			<div className={style.container} onKeyUp={handleKeyDown}>
				<div className={style.applyTblWrap}>
					<div className={style.titleWrap}>
						<span className={style.title} style={{background:`url(${require("@images/list.svg")}) no-repeat 16px center`}}>取材列表（{aflterFilterData().length}）</span>
						<div className={style.search}>
							<Input
								label="病理号："
								lineFeed={false}
								inputStyle={{ width: '188px' }}
								containerStyle={{ float: 'left', marginRight: '10px', position: 'relative' }}
								value={searchNum}
								onChange={e => setSearchNum(e.target.value)}
							/>
							<span className={style.hunt} onClick={e => openCaseDetail(searchNum)}>
								打开
							</span>
						</div>
					</div>
					<Table
						onRow={record => {
							return {
								onDoubleClick: e => openCaseDetail(record.pathnum),
							};
						}}
						columns={columns}
						data={aflterFilterData()}
						rowKey={'pathnum'}
						showPagination
						scroll={{ x: 1880, y: 274 }}
					/>
				</div>
			</div>
			{showDetail && (
				<Detail
					editable={true}
					multiClick={multiClick}
					add={add}
					wax={waxMessage}
					appli={applyMessage}
					pathnum={pathnum}
					handleSeenChange={handleSeenChange}
					closeDetail={closeDetail}
					deleteWax={deleteWax}
					showAddParaffin={showAddParaffin}
                    changeAddParaffin={e=>setShowAddParaffin(e)}
				/>
			)}
		</Page>
	);
}
