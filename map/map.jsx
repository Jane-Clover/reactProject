import * as React from 'react';
import {
    PureComponent,
    PropTypes
} from 'react';
import FormItem from 'amis/form-item';
import * as cx from 'classnames';
import {fetch} from 'amis/util';

@FormItem({
    type:'map-choose'
})
export default class MapChoose extends PureComponent{
    constructor(props) {
        super(props);
        this.onSelect = this.onSelect.bind(this)
        const ID = `itminus_bmap${parseInt(Math.random()*10000000)}`;
        var me = this;
        this.datas = {
            ak: 'MZ4QsnWjCQuZFVXOI9WCSmO0h15ZRBLw',
            callback: (map) => {
                var point = new BMap.Point(116.404, 39.915);  // 创建点坐标
                var bs = map.getBounds();   //获取可视区域
                var bssw = bs.getSouthWest();   //可视区域左下角
                var bsne = bs.getNorthEast();   //可视区域右上角
                map.centerAndZoom(point, 15);
                map.enableScrollWheelZoom(true);
                map.addEventListener("click", function(e){    
                    me.setState({
                        lng: e.point.lng,
                        lat: e.point.lat
                    });   
                });

                this._local = new BMap.LocalSearch(map, {
                    renderOptions: { 
                        map: map,
                        autoViewport: true,
                        panel: "results"
                    },
                    onInfoHtmlSet: poi => {
                        this.onSelect(poi.marker.getPosition(), poi.marker.getTitle());
                    },
                    onSearchComplete: (results) => {
                        var s = [];      
                        for (var i = 0; i < results.getCurrentNumPois(); i ++){ 
                            s.push(results.getPoi(i).point.lat + ", "+results.getPoi(i).point.lng + ", " + results.getPoi(i).address);      
                        } 
                        if(s.length < 1) {
                            alert('没有找到相关结果，换个关键词试试');
                        }
                    }
                });
            },
            id: ID,
            
        };

        this.handleQuery = this.handleQuery.bind(this); 
    }


    componentWillMount(){
        // 注意callback=init参数不能去掉，因为这是百度地图异步加载的接口，
        // 否则，会因为React异步创建了script，百度返回的script中又调用document.write()，从而触发错误
        let bmapSrc=`http://api.map.baidu.com/api?v=2.0&ak=${this.datas.ak}&callback=init`;
        if(typeof BMap !='undefined'){
            return;
        } else {
            let script=document.querySelector(`script[src='${bmapSrc}']`);
            if(!script){
                script= document.createElement("script");
                script.src = bmapSrc;
                document.body.appendChild(script);
            }
        }
    }

    componentDidMount(){
        function timeoutPromise(timeout){
            return new Promise(function(resolve,reject){
                setTimeout(function() {
                    resolve();
                }, timeout);
            });
        }

        function waitUntil(props){
            return new Promise(function(resolve,reject){
                    const map=new BMap.Map(props.id);
                    resolve(map);
                }).catch(err=>{
                console.log("there's no BMap yet. Waitting ...",err);
                return timeoutPromise(300).then(()=>{
                    return waitUntil(props);
                });
            });
        }

        waitUntil(this.datas).then(map=>{
            console.log(`[+] bmap loaded`,map);
            this.datas.callback(map);
    });
    }

    handleQuery() {
          
        this._local.search(this.refs.location_name.value);
    }

    onSelect(poi, title) {
       
        const {setValue} = this.props;
       
        setValue({
            lat: poi.lat,
            lng: poi.lng,
            address: title
        });
    }

    handleRadius() {
        const {setValue} = this.props;

        if(this.refs.radius.value > 5000 || this.refs.radius.value < 0) {
            alert('请填写0~5000的数值');
             setValue({
                radius: ''
            });
        } else {
            setValue({
                radius: this.refs.radius.value
            });
        }

    }


    render() {
        const {getValue, setValue} = this.props;
        var obj = getValue();

        var lat = '';
        var address = '';
        var lng = '';
        var radius = '';

        if(obj !== undefined) {
            lat = obj['lat'];
            address = obj['address'];
            lng = obj['lng'];
            radius = obj['radius'];
        }

    
        const divStyle = {
            height: '300px',
        };
        const topStyle = {
            position: 'absolute',
            top: 0,
            left: 0,
            backgroundColor: '#fff'
        };

        const marginStyle = {
            marginRight: 0
        }

        return (
            <div>
                <div id={this.datas.id} style={divStyle}></div>
                <div className="form-inline" style={topStyle}>
                    <div className="form-group">
                        <label>地点名称</label>
                        <input className="form-control" type="text" ref="location_name"/>
                    </div>
                    <div className="form-group">
                        <input type="button" className="btn btn-success" onClick={this.handleQuery.bind(this)} value="查询"/>
                    </div>
                </div>

                <div className="form-group" style={marginStyle}>
                     <label className="control-label">经度</label>
                    <input className="form-control" type="number" name="mercator_lat" ref="lat" value={lat}/>
                </div>
                <div className="form-group" style={marginStyle}>
                    <label className="control-label">纬度</label>
                    <input className="form-control" type="number" name="mercator_lng" ref="lng" value={lng}/>
                </div>
                <div className="form-group" style={marginStyle}>
                    <label className="control-label">已选地址</label>
                    <input className="form-control" type="text" ref="address" name="location_name" value={address}/>
                </div>
                 <div className="form-group" style={marginStyle}>
                    <label className="control-label">筛选半径（单位：m,最长5000m）</label>
                    <input className="form-control" type="text" ref="radius" name="radius" value={radius} onChange={this.handleRadius.bind(this)}/>
                </div>

            </div>

    )
    }
}