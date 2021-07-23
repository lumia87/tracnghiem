const firebaseConfig = {
apiKey: "AIzaSyCVibTo5GmHS5FauPpbsIB1_H6H8l13rlc",
authDomain: "srldc-exam.firebaseapp.com",
databaseURL: "https://srldc-exam-default-rtdb.asia-southeast1.firebasedatabase.app",
projectId: "srldc-exam",
storageBucket: "srldc-exam.appspot.com",
messagingSenderId: "467054650517",
appId: "1:467054650517:web:ef8a60ea07da173c37279c",
measurementId: "G-HCT7K41D1B"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);           

var N=0; //Theo 
var current=0;
var next,back;
var g;
var exam_el=document.getElementById('exam');
exam_el.addEventListener('change', (event) => {
    const result = document.getElementById('info');
    g=event.target.value;//event.target đây là option
    if (g=='DD'){
        result.textContent='-- Đang cập nhật câu hỏi cho Điều độ viên';
    }
    else if(g=='PT'){
        result.textContent='-- Đang cập nhật câu hỏi cho Kỹ sư Phương thức HTĐ miền';
    }
    else if(g=='CN'){
        result.textContent='-- Đang cập nhật câu hỏi cho Kỹ sư SCADA/EMS';
    }
    else if(g=='TD'){
        result.textContent='-- Đang cập nhật câu hỏi cho Tuyển dụng Điều độ viên';
    }
    else if(g=='TP'){
        result.textContent='-- Đang cập nhật câu hỏi cho Tuyển dụng KS Phương thức';
    }
    else if(g=='TC'){
        result.textContent='-- Đang cập nhật câu hỏi cho Tuyển dụng KS CNTT&SCADA';
    }
    else if(g=='UC'){
        result.textContent='-- Đang cập nhật câu hỏi Ứng dụng CNTT cơ bản';
    }
    //Chạy lại lấy số lượng câu hỏi
    count_questions(g);
    
  });



function FormattedDate(date) {
    var year = date.getFullYear();
  
    var month = (1 + date.getMonth()).toString();
    month = month.length > 1 ? month : '0' + month;
  
    var day = date.getDate().toString();
    day = day.length > 1 ? day : '0' + day;
    
    return day + '/' + month + '/' + year;
  }
// q_part là chứa question, hoặc answer hoặc options
function show_question(element_id, q_part,n){ 
    console.log("Show_question:Đường dẫn=",'/'+g+'/'+n+'/'+q_part)
    firebase.database().ref('/'+g+'/'+n+'/'+q_part).on('value',(snap)=>{
        var p_question=snap.val();
        console.log('#:'+q_part,p_question);
        if (q_part=='options'){
            let l=p_question.length;
            document.getElementById(element_id).innerHTML=''; //Reset lại options, ko sẽ xếp chồng

            for (let i=0;i<l;i++){
                // Tạo element 3 bước
                let el=document.createElement('input'); //1
                el.id='opt_'+i;
                el.setAttribute("type", "text");
                el.setAttribute("value", p_question[i]);
                document.getElementById(element_id).appendChild(el);//3                
            }
        }
        else{
            document.getElementById(element_id).value=p_question;
        }

        
    });    
}

function add_opts(){
    let options=document.getElementById('in_options'); 
    var last=options.getElementsByTagName('input').length;
    prefix=String.fromCharCode(last + 65)+". "; //Để chuyển từ 1->A, 2->B..
    console.log("Đã có ",last," options")
    // Tạo element 3 bước
    let el=document.createElement('input'); //1
    el.id='opt_'+(last);        
    el.setAttribute("type", "text");
    el.setAttribute("value", prefix);
    options.appendChild(el);//3      Thêm một options    
    document.getElementById('info').textContent="-- Add: Đã thêm option thành công";
      
}
//Remove options
function remove_opts(){
    let options=document.getElementById('in_options'); 
    var last=options.getElementsByTagName('input').length;
    console.log("Đã có ",last," options")
    //Remove cuối cùng
    var el=document.getElementById('opt_'+(last-1))
    if (el!=null){
        el.remove();
        document.getElementById('info').textContent="-- Remove: Đã xóa option cuối";
    }
    else{
        console.log("phần tử không chọn được để xóa");
        document.getElementById('info').textContent="-- Remove: Không có phần tử để xóa";
    }

}
// Navigate: Back NExt
const btn_next=document.getElementById('btn_next')
btn_next.addEventListener('click',function(){
    current=current+1;

    current=current>N-1?0:current;
    next=current+1>N-1?0:current+1;   
    back=current-1<0?N-1:current-1;

    console.log("current, back, next",current,back,next);
    
    show_question('in_question','question',current);
    show_question('in_options','options',current);
    show_question('in_answer','answer',current);
    show_question('in_qtype','qtype',current);

    document.getElementById('in_pattern').value=current; //Cập nhật ngược số câu hỏi lên
})

const btn_back=document.getElementById('btn_back')
btn_back.addEventListener('click',function(){
    current=current-1;

    current=current<0?N-1:current;
    next=current+1>N-1?0:current+1;
    back=current-1<0?N-1:current-1;

    console.log("current, back, next",current,back,next);

    show_question('in_question','question',current);
    show_question('in_options','options',current);
    show_question('in_answer','answer',current);
    show_question('in_qtype','qtype',current);
    
    document.getElementById('in_pattern').value=current; //Cập nhật ngược số câu hỏi lên

})

// Tìm kiếm câu hỏi
const btn_search=document.getElementById('btn_search')
btn_search.addEventListener('click',function(){

    let pattern=parseInt(document.getElementById('in_pattern').value);
    if(pattern<=N-1 && pattern>=0){
        
        show_question('in_question','question',pattern);
        show_question('in_options','options',pattern);
        show_question('in_answer','answer',current);
        show_question('in_qtype','qtype',current);
        current=pattern;
        console.log(current,back,next);   //Lưu lại giá trị vị trí hiện tại

    }
    else{
        alert("Vị trí câu hỏi không phù hợp")
    }
    
})

const btn_update=document.getElementById('btn_update');
btn_update.addEventListener('click',function(){
    n=document.getElementById('in_pattern').value;
    var update_quest = window.confirm("Bạn chắc chắn cập nhật câu hỏi "+n);
    if (update_quest==true){       
        update_question();
    } 
    });

//Add optiions
const btn_add=document.getElementById('btn_add')
btn_add.addEventListener('click',function(){
    add_opts();
})

//Remove optiions
const btn_remove=document.getElementById('btn_remove')
btn_remove.addEventListener('click',function(){
    remove_opts();
})
function count_questions(g){
    firebase.database().ref('/'+g).on("value", function(snapshot) {
        console.log("Nhóm ",g," Có "+snapshot.numChildren()+" question");
        //Cập nhật lại số lượng câu hỏi
        N=snapshot.numChildren();
        console.log("N=",N);
      })
}

function update_question(){
    let n = document.getElementById('in_pattern').value; //Lấy giá trị của số câu hỏi đang active;
    console.log("Đang update câu hỏi :",n)
    parts=['question','answer','qtype','options'];
    try{

        for (let part of parts){
            let p=document.getElementById('in_'+part);                   
            let updates={};
    
            if (part=='options'){
                opts=p.querySelectorAll('input');
                opts.forEach(function(item){        
                    updates[(item.id).substr(4,1)]=item.value.toString();
                })
                console.log('Giá trị của options mới',updates)
                firebase.database().ref('/'+g+'/'+n+'/options').set(updates);    
            }
            else{
                updates[part]=p.value.toString();
                console.log("giá trị mới:",part,"là: ",updates[part])
                firebase.database().ref('/'+g+'/'+n).update(updates);    
            }        
        
        }
        //Thông báo cập nhật giá trị mới    
        document.getElementById("info").textContent = "-- Update: Cập nhật thành công câu hỏi "+n;
    }
    catch(err){
        document.getElementById("info").textContent = "-- Update: Có lỗi cập nhật xong câu hỏi"+n;
    }

}