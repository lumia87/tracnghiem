//Chạy firebase
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

var lst_questions; 
var lst_img=[];
var info={} // dùng lưu thông tin người thi
var questions={}; //dung luu cau hoi duoc tai ve

var p; //con trỏ chứa timer để dừng khi cần
var time_interval;
var progress; //Lưu trạng thái đang Thi hay chưa thi
var g;
var timeout;

var cache=0;//Lưu vị trí đã qua;
var current=0;
var back_q=0;
var next_q=0;
var sessionid;
var userid;
var N;
progress=0; //0: chưa thi   ; 1: Đang thi; 2: Đã hoàn tất
var status; //beforeExam; onExam; afterExam;


//Chương trình chính   
window.onload=function(){
    // console.log("window.onload:Tải trang và xác định cách hiện thị")   
    load_exampage();
}




//Tạo lại menu bên trái
function recreate_panel(qs){ //Đây chính là tạo lại panel bên trái
    lst_questions=Object.keys(qs);
    //Lưu dữ liệu trong bộ nhớ web
    let no_questions=lst_questions.length;
    add_question(lst_questions); 
    
    //1. Add event for menu of left question 
    document.querySelectorAll('#left_main_body li a').forEach(item => {
        item.addEventListener('click', event => {
        //handle click
        let qid=parseInt(item.hash.substr(2))  ;

        //thêm một dòng để truyền tham số cho j (hoặc move right hoặc move left)        
        left_active=true;
        right_active=false;
        jj=0;
        // console.log("Click leftmenu: Địa chỉ, current (qid), back_q, next_q",current,back_q,next_q, "tương ứng nhóm: ",g," câu ", lst_questions[qid]);
        show_question2(qid,g);
        //Tô màu cho active-question;
        remove_busy();
        active_question(qid);

        current=qid;
        back_q=current-1<0?N-1:current-1; //Giả sử có N câu
        next_q=current+1>N-1?0:current+1;
        })
    })


    //2. Add event listener for right main
    //2a. Add event for back, next button
    const back_btn=document.querySelector('#btn_back')
    back_btn.addEventListener('click',function(){
            // console.log("câu hỏi trước đó <-",back_q);
            show_question2(back_q,g);
            remove_busy();
            active_question(back_q);

            //cập nhật vị trí
            current=back_q;
            back_q=current-1<0?N-1:current-1; //Giả sử có N câu
            next_q=current+1>N-1?0:current+1;
            
    })

    //2b.Add event for back, next button
    const next_btn=document.querySelector('#btn_next')
    next_btn.addEventListener('click',function(){
            // console.log("câu hỏi Tiếp đó ->",next_q);
            show_question2(next_q,g);

            remove_busy();
            active_question(next_q); 
            //cập nhật vị trí
            current=next_q;
            back_q=current-1<0?N-1:current-1; //Giả sử có N câu
            next_q=current+1>N-1?0:current+1;
            
    })


}

//Khởi tạo panel cho giao diện câu hỏi (dạng promise), dùng lần đầu tiên--> Nó sẽ lưu questions đã có xuống bộ nhớ
function create_panel(){
    let no_questions;
    g=localStorage.getItem('sessionid').substr(0,2);
    //khởi tạo userAnswers
    localStorage.setItem('userAnswers','{}');
    let p=firebase.database().ref('/'+g).once("value");
    p.then(
        (snapshot)=>{
            // console.log("Nhóm ",g," Có "+snapshot.numChildren()+" question");
            //Cập nhật lại số lượng câu hỏi
            let questions=snapshot.val();
            //Lấy toàn bộ key của questions nhóm g
            let key_questions=  Object.keys(questions);       //Trả về list các key cảu nho     
            // console.log("create_panel: Nhóm",g," có danh sách:",key_questions)
            return key_questions//snapshot.numChildren();
        }
    )
    .then((values)=>{
        //Lưu dữ liệu trong bộ nhớ web
        // console.log("createpanel:giá trị values=",values, "và có length=",values.length);
        let no_questions=values.length;
        if(localStorage.getItem('q') == null){
            let question_postions=get_questions(N,0,no_questions-1);//Lấy ds các vị trí trong db            
            lst_questions=question_postions.map(x=>values[x]) //Lấy ngâu nhiên trong 250 câu hỏi
            // console.log("vị trí các câu=", question_postions, "ds các câu=", lst_questions);
            //Lưu lại 
            localStorage.setItem('q', JSON.stringify(lst_questions));    

        }else{    
            //Đã lưu câu hỏi lần trước rồi --> Lấy ra xài N câu hỏi'
            lst_questions=JSON.parse(localStorage.getItem('q'));   
        }
        //Tạo menu bên trái và bên phải theo ds câu hỏi chọn được
        add_question(lst_questions); 
        //Thêm các 
        
        //1. Add event for menu of left question 
        document.querySelectorAll('#left_main_body li a').forEach(item => {
            item.addEventListener('click', event => {
            //handle click
            let qid=parseInt(item.hash.substr(2))  ;

            show_question2(qid,g);
            //Tô màu cho active-question;
            remove_busy();
            active_question(qid);
            current=qid;
            back_q=current-1<0?N-1:current-1; //Giả sử có N câu
            next_q=current+1>N-1?0:current+1;
            console.log("Click leftmenu: Địa chỉ, current, qid",current, "tương ứng nhóm: ",g," câu ", lst_questions[qid]);
            })
        })


        //2. Add event listener for right main
        //2a. Add event for back, next button
        const back_btn=document.querySelector('#btn_back')
        back_btn.addEventListener('click',function(){
                console.log("câu hỏi trước đó <-",back_q);
                show_question2(back_q,g);
                remove_busy();
                active_question(back_q);

                //cập nhật vị trí
                current=back_q;
                back_q=current-1<0?N-1:current-1; //Giả sử có N câu
                next_q=current+1>N-1?0:current+1;
                
        })

        //2b.Add event for back, next button
        const next_btn=document.querySelector('#btn_next')
        next_btn.addEventListener('click',function(){
                console.log("câu hỏi Tiếp đó ->",next_q);
                show_question2(next_q,g);

                remove_busy();
                active_question(next_q); 
                //cập nhật vị trí
                current=next_q;
                back_q=current-1<0?N-1:current-1; //Giả sử có N câu
                next_q=current+1>N-1?0:current+1;
                
        })


    })
   
}

function count_questions(g){
    firebase.database().ref('/'+g).once("value", function(snapshot) {
        console.log("Nhóm ",g," Có "+snapshot.numChildren()+" question");
        //Cập nhật lại số lượng câu hỏi
        N=snapshot.numChildren();
        console.log("N=",N);
      })
}
//- Tạo đề mới
const reset_exam=document.getElementById('reset');
reset_exam.addEventListener('click',()=>{
    console.log('Tạo đề thi mới');
    document.getElementById('btn_control').disabled=false;
    document.getElementById('btn_control').textContent='BẮT ĐẦU';
    
    localStorage.clear();
    window.location.reload();
    alert("Đã tạo lại đề thi...");

})

//- In phiếu điểm
const printres=document.querySelector('#btn_print_res')
printres.addEventListener('click', function(){
    setTimeout(() => {
        print_res();
    }, 500);
    
});
//- In kết quả thi
const printexam=document.querySelector('#btn_print_exam')
printexam.addEventListener('click', function(){
    setTimeout(() => {
        print_exam();
    }, 500);
    
});

//Truy nhập đến trang help
const btn_help=document.querySelector('#help')
btn_help.addEventListener('click', function(){
    window.open('./help.html','Trợ giúp');
});

//Truy nhập đến trang admin
const btn_admin=document.querySelector('#admin')
btn_admin.addEventListener('click', function(){
    setTimeout(() => {
        let password=document.getElementById('txt_password').value;
        let hash_pass='ca5f6737fb88830e6100b73dcb2581688c2b0b7d69fa6c6ebc3c67355f6249bf';        
        if (hex_sha256(password) == hash_pass){
            admin_page=window.open('./admin_'+password+'.html','Trang quản lý câu hỏi');
        }
        else{
            alert("nhập không đúng password");
        }
        
    }, 500);
    
});

//Mở thiết lập config
const show_config=document.querySelector('#btn_showconfig')
show_config.addEventListener('click', function(){
    el=document.getElementById('config_page');
    if (el.style.display=='block'){
        el.style.display='none';
    }
    else{        
        el.style.display='block';
    }
    
});

const btn_config=document.querySelector('#btn_config')
btn_config.addEventListener('click', function(){
    N=parseInt(document.getElementById('in_no_q').value);
    time_interval=parseInt(document.getElementById('in_interval').value)*60;
    // console.log("Config: Số câu hỏi=",N,"thời gian=",time_interval);
    localStorage.setItem('N',N);
    localStorage.setItem('time_interval',time_interval);
    document.getElementById('config_page').style.display='none';    
});
//f
function show_res(){
    var res={};
    let txt_userAnswers=localStorage.getItem('userAnswers');
    if (txt_userAnswers!=null){
        res=JSON.parse(txt_userAnswers);
        let N=parseInt(localStorage.getItem('N')); //lst_questions.length; //Tổng số câu hỏi
        let n_ans=Object.values(res).filter(x=>x.length>0).length; //Số câu đã trả lời
        //Hàm tính điểm
        let correct_ans=0;
        let res2={}; //Đúng thì ghi True, còn Sai thì ghi đáp án đúng theo db (ví dụ A, hay B, hay C)
        let w_res={} //Chứa các câu trả lời bị sai
        //Tạo các promises array
        return get_solutions().then(
            (answers)=>{
                Object.keys(answers).forEach(
                    (key)=>{
                        if(answers[key]==res[key]){
                            res2[key]=true;
                            correct_ans+=1;
                        }
                        else{
                            res2[key]=answers[key];//lưu câu sai, và value là giá trị câu đúng
                            w_res[key]=lst_questions[key];//Lưu vị trí câu hỏi sai trên database
                        }
    
                    }
                )            
        
                let test_score=Math.round(correct_ans/N*100);
                let result=(test_score>=70) ? "ĐẠT" : "KHÔNG ĐẠT";
                
                //Lưu lại để đẩy lên hệ thống hoặc để giái trình
                localStorage.setItem('correct_ans',correct_ans);
                localStorage.setItem('res2',JSON.stringify(res2));
                localStorage.setItem('w_res',JSON.stringify(w_res));
                return [N, correct_ans, test_score,result]
                        
            })
    }
    else{
        console.log("chưa có res (userAnswers) trong local")
    }  
}

//Hàm in kết quả thi
function print_res(){
    var printwindow = window.open("./report.html", "Print Page");
    printwindow.onload=function(){
        // console.log("Bắt đầu chạy print_res");

        let info=JSON.parse(localStorage.getItem('info'));  
        if (info==null){
            info=get_info();
        }

        // console.log("info = ",info);
        // console.log('list questions',lst_questions);
        let exam='';

        if (info['exam']=='DD'){
            exam="Nâng bậc Điều độ viên miền"
        }
        else if (info['exam']=='PT'){
            exam="Nâng bậc Kỹ sư Phương thức HTĐ miền"
        }
        else if (info['exam']=='CN'){
            exam="Nâng bậc Kỹ sư SCADA/EMS HTĐ miền"
        }
        else if (info['exam']=='TD'){
            exam="Tuyển dụng Điều độ viên miền"
        }
        else if (info['exam']=='TP'){
            exam="Tuyển dụng Kỹ sư Phương thức HTĐ miền"
        }
        else if (info['exam']=='TC'){
            exam="Tuyển dụng Kỹ sư SCADA/EMS HTĐ miền"
        }
        else{
            exam="Ứng dụng CNTT cơ bản"
        }

        var res={};
        let txt_userAnswers=localStorage.getItem('userAnswers');
        if (txt_userAnswers!=null){
            res=JSON.parse(txt_userAnswers);
        }
        else{
            console.log("chưa có res (userAnswers) trong local")
        }
        
        let N=parseInt(localStorage.getItem('N')); //lst_questions.length; //Tổng số câu hỏi
        let n_ans=Object.values(res).filter(x=>x.length>0).length; //Số câu đã trả lời
        //Hàm tính điểm
        let correct_ans=0;
        let res2={}; //Đúng thì ghi True, còn Sai thì ghi đáp án đúng theo db (ví dụ A, hay B, hay C)
        let w_res={} //Chứa các câu trả lời bị sai
        //Tạo các promises array
        return get_solutions().then(
            (answers)=>{
                Object.keys(answers).forEach(
                    (key)=>{
                        if(answers[key]==res[key]){
                            res2[key]=true;
                            correct_ans+=1;
                        }
                        else{
                            res2[key]=answers[key];//lưu câu sai, và value là giá trị câu đúng
                            w_res[key]=lst_questions[key];//Lưu vị trí câu hỏi sai trên database
                        }

                    }
                )})
            .then(
                ()=>{
                    // console.log("Kết quả chạy checkres: ", res2);     
                    // console.log("Tổng số câu hỏi", N );                
                    // console.log("Số câu đã trả lời", n_ans ); 
                    // console.log("Số câu đúng: ", correct_ans);
                    // console.log("Số câu sai: ", N-correct_ans);
                    // console.log("Các câu sai: ", w_res);//Chứa danh sách các câu sai, phục vụ thống kê.
  
                    //Hiện thị ra kết quả để in
                    printwindow.document.getElementById('exam').innerHTML=exam;   
                    printwindow.document.getElementById('grade').innerHTML=info['grade'];    
                    printwindow.document.getElementById('no_q').innerHTML=N;  
                    printwindow.document.getElementById('ans_correct').innerHTML=correct_ans;    

                    let test_score=Math.round(correct_ans/N*100);
                    let result=(test_score>=70) ? "ĐẠT" : "KHÔNG ĐẠT";

                    printwindow.document.getElementById('span_point').innerHTML=test_score+'/100';
                    printwindow.document.getElementById('result').innerHTML=result;    
                    printwindow.document.getElementById('fullname').innerHTML=info['fullname']   
                    printwindow.document.getElementById('dob').innerHTML=FormattedDate(new Date(info['dob']))
                    printwindow.document.getElementById('gender').innerHTML=info['gender']
                    printwindow.document.getElementById('id').innerHTML=info['id']
                    printwindow.document.getElementById('org').innerHTML=info['org']
                    let d= new Date();
                    let exam_date=FormattedDate(d);
                    printwindow.document.getElementById('examdate').innerHTML=exam_date;
                    printwindow.document.getElementById('day').innerHTML=exam_date.substr(0,2)
                    printwindow.document.getElementById('month').innerHTML=exam_date.substr(3,2)
                    printwindow.document.getElementById('year').innerHTML=exam_date.substr(6,4)
                    printwindow.document.close();     
                    // printwindow.print();

                    //Lưu lại để đẩy lên hệ thống hoặc để giái trình
                    localStorage.setItem('correct_ans',correct_ans);
                    localStorage.setItem('res2',JSON.stringify(res2));
                    localStorage.setItem('w_res',JSON.stringify(w_res));
    
                }
            )
      
    }
}
//Hàm in chi tiết bài thi
function print_exam(){    
    
    report=window.open('./report1.html','Kết quả thi');
    report.onload=function(){   
        let correct_ans=0;
        let N;
        //Lấy Đáp án trên db
        //In các thông tin chung          
        let info=JSON.parse(localStorage.getItem('info'));  
        if (info==null){
            info=get_info();
        }

        // console.log("PrintExam:in các kq của info",info);      

        let promise1= getAllQuestions();  
        let promise2=  get_solutions();
    
        Promise.all([promise1, promise2]).then((values) => {
            // console.log('Giá trị promises: ',values);
            //Lay gia tri cac cau tra loi
            var userAnswers={} ;
            var questions=values[0];
            var solutions=values[1];

            let txt_userAnswers=localStorage.getItem('userAnswers');
            if (txt_userAnswers!=null){
                userAnswers=JSON.parse(txt_userAnswers);
            }
            else{
                userAnswers=show_progress();
            }
            // console.log("Hien thi ket qua da tra loi ", userAnswers);
            // console.log("Hien thi ket qua async questions ", questions);
            // console.log("Hien thi ket qua async solutions ", solutions);

            let exam='';

            if (info['exam']=='DD'){
                exam="Nâng bậc Điều độ viên miền"
            }
            else if (info['exam']=='PT'){
                exam="Nâng bậc Kỹ sư Phương thức HTĐ miền"
            }
            else if (info['exam']=='CN'){
                exam="Nâng bậc Kỹ sư SCADA/EMS HTĐ miền"
            }
            else if (info['exam']=='TD'){
                exam="Tuyển dụng Điều độ viên miền"
            }
            else if (info['exam']=='TP'){
                exam="Tuyển dụng Kỹ sư Phương thức HTĐ miền"
            }
            else if (info['exam']=='TC'){
                exam="Tuyển dụng Kỹ sư SCADA/EMS HTĐ miền"
            }
            else{
                exam="UC"
            }

            report.document.getElementById('exam').textContent=exam;


            let d= new Date();         
            let exam_date=FormattedDate(d);
            report.document.getElementById('examdate').innerHTML=exam_date;
            report.document.getElementById('fullname').innerHTML=info['fullname'];
            report.document.getElementById('gender').innerHTML=info['gender'];
            report.document.getElementById('id').innerHTML=info['id'];  
            report.document.getElementById('dob').innerHTML=FormattedDate(new Date(info['dob']));
            report.document.getElementById('org').innerHTML=info['org'];
  
            //In các thông tin bài làm
            N=lst_questions.length;
            const tbl_outcome= report.document.getElementById('tbl_outcome');
            
            for (let j=0;j<lst_questions.length;j++){       
                let question=("Câu "+(j+1)+". ").bold()+questions[j][0];
                let opts=questions[j][1];
                let solution=solutions[j];
    
                // console.log("In cau hoi so ",j, "tuong ung cau",lst_questions[j]);
                let quest_row=tbl_outcome.insertRow(-1);                        
                // Append a text node to the cell
                let quest_cell=quest_row.insertCell(0);//Câu hỏi
                // quest_cell.colSpan = "3";
                let quest_html = document.createElement('span');
                quest_html.innerHTML=question;
                quest_cell.appendChild(quest_html);
                //Kết thúc dòng thứ nhất
            
                let options_row=tbl_outcome.insertRow(-1); //Dòng thứ 2    
            
                // Ô các lựa chọn
                let options_cell = options_row.insertCell(0);//Các lựa chọn
                let tmp='';
                for (let opt of opts){
                    let opt_html = document.createElement('p');
                    opt_html.innerHTML=opt;
                    options_cell.appendChild(opt_html);
                }           
            
                // Ô trả lời của người thi
                let answer_cell = options_row.insertCell(1);//Tra loi cua thi sinh
                let ans=(userAnswers[j]!=null)?userAnswers[j]:'-';
                let ans_txt = document.createTextNode(ans);
                answer_cell.appendChild(ans_txt);
            
                // Ô kết quả
                let res_cell = options_row.insertCell(2);//Ket qua
                let res=(ans==solution)?"Đúng":"Sai ("+solution+")";
                let res_txt = document.createTextNode(res);
                res_cell.appendChild(res_txt);             

                //Cập nhật số câu đúng
                
                correct_ans=(ans==solution)?correct_ans+1:correct_ans;           
            }
            setTimeout(() => {
                // console.log("số câu đúng=",correct_ans, " tổng số câu=", N)
                
                report.document.getElementById('test_score').textContent=Math.round(correct_ans/N*100)+"/100";    
                report.document.close();     
                // report.print();     
            }, 500);

        });


    }
}



// Add event listener for right main
//Cách 1: Dùng document.querySelectorAll.forEach cho #right_main_body, nhưng ko được
// Cách 2: Vì cách 1 trong bản beta ko chạy được
function check_status(qid){ //kiểm tra tình trạng câu hỏi q trong list
    var ele= document.getElementById('span_'+(qid));
    ele.parentNode.classList.add("stat_busy_2");
    let selector='#opts'+qid+' li input';
    let options=document.querySelectorAll(selector);
    let chk=false;
    var userAnswers;
    let txt_userAnswers=localStorage.getItem('userAnswers');
    // console.log("userAnswers",txt_userAnswers);
    if (txt_userAnswers!=null){
        userAnswers=JSON.parse(txt_userAnswers);
        // console.log("Tải dl trả lời=",userAnswers)
    }
    else{
        // console.log("Check_status: Chưa có userAnswers");
        userAnswers={};
    }

    let answer_i=''
    for (let opt of options){       
        let opt_abc=cnum2abc(opt.value);
        if (opt.checked==true){
            chk=true;//Chỉ cần 1 lần là online rồi            
            // console.log("Thay đổi trạng thái sang đã checked");
            ele.classList.add("stat_online");   
            //lưu lại kết quả xuống local storage                   

            if (userAnswers[qid]==null){
                answer_i=opt_abc;
                // console.log("DL câu hỏi",qid," chưa có opt -> thực hiện thêm ",opt_abc)
            }
            else if (userAnswers[qid].includes(opt_abc)==false){
                // console.log("DL câu hỏi",qid," đã có opt -> thực hiện thêm ",opt_abc)
                answer_i=userAnswers[qid]+opt_abc;
            }
        }
        else{//checked=false        
            if (userAnswers[qid]!=null && userAnswers[qid].includes(opt_abc)==true){
                    // console.log("DL câu hỏi",qid," gỡ ",opt_abc)
                    answer_i=userAnswers[qid].replace(opt_abc,""); //gỡ ra
                }
        }

    }
    
    userAnswers[qid]=answer_i;

    localStorage.setItem('userAnswers',JSON.stringify(userAnswers));
    
    if (chk==false){
        // console.log("Xóa online");
        ele.classList.remove("stat_online");
    }

    
    return chk; //chk=false là chưa trả lời, còn true là đã trả lời
   
  }

//fucntion disable info
function disable_infopage(){

    document.getElementById('info_page').style.display='none';
    document.getElementById('exam_page').style.display='block';

}
function is_valid(x){
    if (x.length>0 && x.search('_')==-1){
        return true;
    }
    else
    {
        return false;
    }
}

//Tạo hàm hiện giao diện: 1) Khi chưa chạy: Chửa có sssionid - chưa thi 2) Đã chọn đề: Đã có sessionid - đang thi  3) Kết thúc: xóa sessionid); 3)
function load_exampage(){
    let sessionid=localStorage.getItem('sessionid');
    status='beforeExam';
    //1.Chưa chạy bao giờ --> Load page ban đầu
    if (sessionid==null){
        
        // console.log("load_exampage: Tình trạng Chưa thi, status",status,"session id=",sessionid);
        //Hiện trang thông tin, nhưng trang thi ẩn đi
        
        document.getElementById('info_page').style.display='block';
        document.getElementById('exam_page').style.display='none';
        document.querySelector('#btn_control').textContent='BẮT ĐẦU';

        //tải lại dựa vào sessionid để refessh        
    }
    //2 Load lại giao diện Đang chạy
    else if (sessionid.length>0 && is_valid(sessionid)==true){
        //Tải lại mỗi khi refresh
        // console.log("load_page:set lại status là onexam")
        status='onExam';
        
        // console.log("load_exampage: Tình trạng đang thi, status",status,"session id=",sessionid);
        document.getElementById('div_config').style.display='none';
        document.getElementById('in_interval').value=parseInt(localStorage.getItem('time_interval'))/60;
        document.getElementById('in_no_q').value=localStorage.getItem('N')


        //Hiện trang thông tin, nhưng trang thi ẩn đi
        disable_infopage();
        
        N=parseInt(document.getElementById('in_no_q').value);
        time_interval=parseInt(document.getElementById('in_interval').value)*60;
        //Tiếp tục đếm giờ
        newstart=Date.now();
        oldstart=localStorage.getItem('start');
        time_passed=newstart-oldstart;
        // console.log("Đã trải qua bao nhiêu giây:", time_passed/1000);
        time_interval=time_interval-time_passed/1000;

        const display = document.querySelector('#timer');
        var timer=startTimer(time_interval, display);

        //Khóa chức năng của nút điều khiển khi hết giờ
        // console.log("Thời gian còn lại", time_interval);
        setTimeout(
        function(){
            // console.log("Đã hết giờ");
            timeout=true;
            // status='afterExam';
            if (status=='onExam'){//câu này dư???
                document.querySelector('#btn_control').click();
            }
            
            }
        ,time_interval*1000);//Khóa chức năng của nút bấm khi hết giờ


        document.querySelector('#btn_control').textContent='NỘP BÀI';
        
        
        let info=JSON.parse(localStorage.getItem('info'));
        // console.log('in kết quả info',info);
        g=info['exam'];

        let idx_exam;
        switch(info['exam']){
            case 'DD':
                idx_exam= '0';
                break;
            case 'PT':
                idx_exam= '1';
                break;
            case 'CN':
                idx_exam= '2';
                break;
            case 'TD':
                idx_exam= '4';
                break;
            case 'TP':
                idx_exam= '5';
                break;
            case 'TC':
                idx_exam= '6';
                break;
            case 'UC':
                idx_exam= '7';
                break;
        }
        document.getElementById('fullname').value=info['fullname'];
        document.getElementById('exam').selectedIndex=idx_exam;
        document.getElementById('grade').value=info['grade'];
        document.getElementById('dob').value=formatDate(new Date(info['dob']));
        document.getElementById('id').value=info['id'];
        document.getElementById('gender').value=info['gender'];
        document.getElementById('org').value=info['org'];      
        
        //Restore lại câu hỏi và đáp án
        let userAnswers=JSON.parse(localStorage.getItem('userAnswers'));

        
        let txt_questions_bak=localStorage.getItem('questions_bak');
        if (txt_questions_bak!=null){
            let questions=JSON.parse(txt_questions_bak);

                lst_qs=Object.keys(questions);     
                recreate_panel(lst_qs) ;         
                show_allquestions(questions,userAnswers);
                marked(userAnswers);
        }
        else{
            console.log("Bạn đã xóa mất questions_bak");
            getAllQuestions().then(
                (questions)=>{
                    
                lst_qs=Object.keys(questions);     
                recreate_panel(lst_qs) ;         
                show_allquestions(questions,userAnswers);
                marked(userAnswers);
                }
            )

        }

    }
    else
    //3 giao diện Kết thúc thi
    {
        status='afterExam';
        // console.log("load_exampage: Tình trạng đã kết thúc thi status",status,"session id=",sessionid);
        
        //Tải lại mỗi khi refresh
        let info=JSON.parse(localStorage.getItem('info'));
        let username,userid;
        if (info!=null){
            username=info['fullname'];
            userid=info['id'];  
        }
        else{
            username=get_info()['fullname'];//tương ứng với info['fullname'];
        }
        disable_infopage();
        btn_control.textContent="BÀI THI MỚI";
        document.getElementById('top_exam_page').style.display='block';   
        document.getElementById('info_page').style.display='none';//hide lại trang thông tin
        document.getElementById('main_exam_page').style.display='none';//hide lại trang exam
        document.querySelector('#top_exam_fullname').textContent=username;

    }
}
//Add event for kết thúc/Bắt đầu

const btn_control=document.querySelector('#btn_control')
btn_control.addEventListener('click',function(){
    //Bấm lần đầu nghĩa là bắt đầu thi
    if (status=='beforeExam'){
        // console.log("Bấm nút finish: Tình trạng từ Chưa thi --> Đang thi, status(old)",status);
        status='onExam';
        //None div_config
        document.getElementById('div_config').style.display='none';
        //Lưu thông tin người thi xuống bộ nhớ
        let info=get_info();
        localStorage.setItem('info',JSON.stringify(info));            
        //Khởi tạo ID cho lần đăng nhập đầu tiên
        sessionid=create_sessionid();
        // document.getElementById('session_id').textContent=sessionid;     
        N=parseInt(document.getElementById('in_no_q').value);
        time_interval=parseInt(document.getElementById('in_interval').value)*60;
        // console.log("Config: Số câu hỏi=",N,"thời gian=",time_interval);

        localStorage.setItem('sessionid',sessionid); //lưu xuống bộ nhớ       
        localStorage.setItem('N',N);
        localStorage.setItem('time_interval',time_interval);
        //Gọi giao diện menu
        disable_infopage();
        create_panel();

        //Lưu lại thời điểm bắt đầu
        const start=Date.now();
        // console.log('Thời điểm bắt đầu',start);
        localStorage.setItem('start',start);
        const display = document.querySelector('#timer');
        var timer=startTimer(time_interval, display);
        btn_control.classList.add("button-onexam");
        btn_control.textContent="NỘP BÀI";

        //Khóa chức năng của nút điều khiển khi hết giờ
        // console.log("Thời gian còn lại", time_interval);
        setTimeout(
        function(){
            console.log("Đã hết giờ");
            timeout=true;
            document.getElementById('btn_control').click();
            }
        ,time_interval*1000);//Khóa chức năng của nút bấm khi hết giờ
        

    }
    else if(status=='onExam'){//Đang thi, bấm là Nộp bài 
        sessionid=localStorage.getItem('sessionid');;//tránh trường hợp đang thi(onexam) rồi refesh thì sessionid bị mất, ko tạo lại được.
        // console.log("Bấm nút control: Tình trạng ..., status(before)",status,"session id=",sessionid); 
        let userAnswers=JSON.parse(localStorage.getItem('userAnswers'));
        lst_questions=JSON.parse(localStorage.getItem('q'));   
        let N=lst_questions.length; //Tổng số câu hỏi
        let n_ans=Object.values(userAnswers).filter(x=>x.length>0).length; //Số câu đã trả lời  
        if (timeout!=true){
            var finish = window.confirm("Bạn chắc chắn nộp bài thi?\n-- Số câu đã trả lời: "+n_ans);
        }  
        else{
            alert("Đã hết giờ")
        }    
        
        
        if (timeout==true || finish==true){
            status='afterExam';//Chuyển sang trạng thái thứ 3   
            //Xóa bộ đếm
            clearInterval(p);
            //lưu câu trả lời xuống đề phòng bị refresh
            // localStorage.setItem('userAnswers',JSON.stringify(res)); //do đã có từ khi create_panel()
           
            let info=JSON.parse(localStorage.getItem('info'));  
            let q=JSON.parse(localStorage.getItem('q'));  


            document.getElementById('timer').textContent="00:00";
            //Hiện thị ra Trang afterexam;
            btn_control.classList.add("button-afterexam");
            btn_control.textContent="BÀI THI MỚI";
            document.getElementById('top_exam_page').style.display='block';
            show_res().then(
                (res)=>{
                    document.getElementById('result').textContent=" "+res[1]+"/"+res[0]+" câu đúng"
                }
            )
            let username;
            if (info!=null){
                username=info['fullname'];
            }
            else{
                username=get_info()['fullname'];//tương ứng với info['fullname'];
            }
    
            document.querySelector('#top_exam_fullname').textContent=username;
            document.getElementById('info_page').style.display='none';//hide lại trang thông tin
            document.getElementById('main_exam_page').style.display='none';//hide lại trang exam
            
             //gửi kết quả lên server
             saveExamInfo(sessionid,info,q,userAnswers).then(
                 ()=>{
                    console.log("Đã gửi dữ liệu lên server thành công");
                    //Chỉnh sửa id cho session
                    sessionid=sessionid+"_";
                    localStorage.setItem('sessionid',sessionid);

                 }
             )

        } 
        else{

        }

    }
    else if (status=='afterExam'){
        console.log("Vừa bấm nút Control: Tình trạng ..., status(old)",status,"session id=",sessionid);
        
        status='afterExam';
        console.log('Vừa bấm Control: xóa local storage thực hiện phần thi mới');
        document.getElementById('btn_showconfig').disabled=false;
        localStorage.clear();
        window.location.reload();

    }


})

////
function get_questions(n,min_rnd,max_rnd){
    let lst=[];
    for(i=1;i<=n;i++)
    {       
        let tmp;    
        do {
           tmp=rnd(min_rnd,max_rnd);
        }
        while (lst.includes(tmp)==true); //đảm bảo không bị trùng câu
        lst[i-1]=tmp;
    }
    return lst;
}


//Tạo hàm ngẫu nhiêu từ a đến b
function rnd(a,b){
    var res=a+Math.floor(Math.random()*(b+1-a)) //1+rnd*(9-1)
    return res;
}

//tạo hàm thay đổi dạng input từ radio sang checkbox


function add_question(lst){
   let n=lst.length /* độ dài của câu hỏi */
    /////////////////////////////////////////////////////////////////////
    // Tạo menu bên trái
    // console.log("tạo menu bên trái")
    let left__main=document.getElementById('left_main_body'); 
    panel_q=document.createElement('ul')
    panel_q.className='qclass'
    tmp=''
    for (k=0; k<n; k++){  
        tmp=tmp+"<li class='li_"+((k)%2)+"'><span id=span_"+(k)+" class='stat stat_busy'></span><a href='#q"+(k)+"'>"+"Câu "+(k+1)+"</a></li>"       
    }
    panel_q.innerHTML=tmp
    left__main.appendChild(panel_q)  

}

function marked(as){
    if (as!=null)
    {
        Object.keys(as).forEach(
            (key)=>{   
                   
                if (as[key].length>0){
                    // console.log("Đang thực hiện đánh dấu câu đã trả lời",key)   
                    document.getElementById('span_'+key).classList.add('stat_online');
                }
                
            }
        )
    }
    else{
        // console.log("Chưa có câu hỏi được trả lời trong local")
    }

}

function active_question(n){
    document.getElementById('activequest').textContent=" "+(n+1); //Số đém khác với số trên list Câu hỏi...
    document.getElementById('span_'+(n)).parentNode.classList.add('stat_busy_2'); //đây là li
    document.getElementById('span_'+(n)).nextSibling.classList.add('stat_busy_2'); //đây là span, bôi chữ trắng, màu xanh ô nhỏ
   
}

function cnum2abc(txt_nums){
    let tmp='';
    let lst_nums=txt_nums.split("");
    for (let num of lst_nums){
        switch(num) {            
            case '0':
                tmp=tmp+'A'
                break;
            case '1':
                tmp=tmp+'B'
                break;
            case '2':
                tmp=tmp+'C'
                break;
            case '3':
                tmp=tmp+'D'
                break;
            case '4':
                tmp=tmp+'E'
                break;
            default:
                // console.log("Có lỗi xảy ra khi chuyển options câu hỏi:")
        }
    }
    return tmp;
}

function cabc2num(txt_abc){
    let tmp='';
    // console.log("Đang split",txt_abc);
    let lst_abc=txt_abc.split("");
    for (let ch of lst_abc){
        switch(ch) {            
            case 'A':
                tmp=tmp+'0'
                break;
            case 'B':
                tmp=tmp+'1'
                break;
            case 'C':
                tmp=tmp+'2'
                break;
            case 'D':
                tmp=tmp+'3'
                break;
            case 'E':
                tmp=tmp+'4'
                break;
            default:
                console.log("Có lỗi xảy ra khi chuyển options câu hỏi");
        }
    }
    return tmp;
}


function show_progress(){
    let answers={}
    let N=lst_questions.length;

    for (let i=0;i<N;i++){
        let tmp='';
        let answer_qi=check_status(i)
        let selector='#opts'+i+' li input';
        let options=document.querySelectorAll(selector);
        for (let opt of options){
            if (opt.checked==true){
                switch(opt.value) {
                    case '0':
                        tmp=tmp+'A'
                        break;
                    case '1':
                        tmp=tmp+'B'
                        break;
                    case '2':
                        tmp=tmp+'C'
                        break;
                    case '3':
                        tmp=tmp+'D'
                        break;
                    case '4':
                        tmp=tmp+'E'
                        break;
                    default:
                        console.log("Có lỗi xảy ra khi chuyển options câu hỏi:",i)
                }
                     
            }
        }
        if (tmp.length>0){  
            tmp=tmp.split("").sort().join("");       
            answers[i]=tmp;//Còn lại không tính
        }
        else{
            answers[i]=''; //Van luu lai neu ket qua chua tra loi
        }
    }
    //hiện kết quả các câu đã trả lời
    // let progress="*Số câu đã trả lời: "+lst_answers.length+" *Số câu chưa trả lời: "+(N-lst_answers.length);
    // document.getElementById('footer').textContent=progress;
    // console.log("Ket qua tra loi o ham show_progress", answers);
    return answers;
    
}

function remove_busy(){
    var quests=document.querySelectorAll('#left_main_body ul li').forEach(item=>{
        item.classList.remove('stat_busy_2');
        item.childNodes[1].classList.remove('stat_busy_2'); //Vì childnode 0 là span, childnode 1 là a.
    });

}


function startTimer(duration, display) {
    var start = Date.now(),
        diff,
        minutes,
        seconds;
    function timer() {

        diff = duration - (((Date.now() - start) / 1000) | 0);
        minutes = (diff / 60) | 0;
        seconds = (diff % 60) | 0;

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        display.textContent = minutes + ":" + seconds; 

        if (diff <= 0) {            
            clearInterval(p); //Dừng khi hết thời gian.
            return 'timeout';
        }
    };
    timer();
    p=setInterval(timer, 1000);//Sau 1 giây thì gọi hàm timer để coi là mấy phút, mấy giây
}
//Lấy thông tin cá nhân
function get_info(){
    let info={};
    let g_exam=document.getElementById('exam');
    info['exam']=g_exam.options[g_exam.selectedIndex].value;
    info['grade']=document.getElementById('grade').value;
    info['fullname']=document.getElementById('fullname').value;
    info['dob']=new Date(document.getElementById('dob').value);
    info['id']=document.getElementById('id').value;
    info['gender']=document.getElementById('gender').value;
    info['org']=document.getElementById('org').value;
    info['examdate']=new Date();
    return info;
}
//Tai ve cac cau tra loi cua de thi

//Tính điểm



function FormattedDate(d) {
    try{
        var year = d.getFullYear();  
        var month = (1 + d.getMonth()).toString();
        month = month.length > 1 ? month : '0' + month;      
        var day = d.getDate().toString();
        day = day.length > 1 ? day : '0' + day;
    }
    catch (e){
        console.log("Có lỗi chuyển đổi ngày tháng năm: "+e);
        day='???';
        month='???'
        year='???'
    }
    
    return day + '/' + month + '/' + year;
  }

function formatDate(d){
    try{
        var year = d.getFullYear();  
        var month = (1 + d.getMonth()).toString();
        month = month.length > 1 ? month : '0' + month;      
        var day = d.getDate().toString();
        day = day.length > 1 ? day : '0' + day;
    }
    catch (e){
        console.log("Có lỗi chuyển đổi ngày tháng năm: "+e);
        day='___';
        month='___'
        year='______'
    }
    
    return year + '-' + month + '-' + day;
}
function show_allquestions(qs,as){//hàm này lấy từ local
    var div_questions=document.getElementById('right_main_body');
    if(lst_questions==null){
        lst_questions=JSON.parse(localStorage.getItem('q'));   
    }
    Object.keys(qs).forEach(
        (key,n)=>{            
            //Kiểm tra nếu có câu n rồi thì hiện ra, không thì tạo và lưu cache
            let qn_content=qs[n][0]
            let qn_answers=qs[n][1];

            let an='';
            if (as!=null && as[n]!=null){
                an =cabc2num(as[n]);
            }
            
            let qn=document.getElementById('q'+n);
            if (qn!=null ){
                qn.style.display='block';
            }
            else{
                //Tạo nội dung câu hỏi
                var el1=document.createElement('div');
                el1.id='q'+n;
                el1.className='right__main__body__question';
                
                div_questions.appendChild(el1);
                let tmp=''
                //tạo nội dung câu hỏi và trả lời trả lời
                tmp="<p>"+qn_content+"</p><ul id=opts"+n+">";                                
                for (let i=0; i<qn_answers.length;i++){
                    if (an.includes(i)){
                        tmp=tmp+"<li><input checked type='checkbox' id='q"+n+"_"+i+ "' name='"+n+"' onclick='check_status("+n+")' value='"+i+"'><label for='q"+n+"_"+i+"'>"+qn_answers[i]+'</label></li>';
                    }
                    else{
                        tmp=tmp+"<li><input type='checkbox' id='q"+n+"_"+i+ "' name='"+n+"' onclick='check_status("+n+")' value='"+i+"'><label for='q"+n+"_"+i+"'>"+qn_answers[i]+'</label></li>';
                    }
                }
                tmp=tmp+'</ul>';            
                document.getElementById('q'+n).innerHTML=tmp;
            }
            
            document.getElementById('q'+n).style.display='none'; //hide luôn câu hỏi này

        }
    )
}

function show_question2(n,g){ //n là câu hỏi trong list question
    var questions=document.getElementById('right_main_body');
    if(lst_questions==null){
        lst_questions=JSON.parse(localStorage.getItem('q'));   
    }
    //Kiểm tra nếu có câu n rồi thì hiện ra, không thì tạo và lưu cache
    let qn=document.getElementById('q'+n);
    if (qn!=null ){
        qn.style.display='block';
        console.log('Hiện block của ',n);
    }
    else{//Tạo câu hỏi
        var el1=document.createElement('div');
        el1.id='q'+n;
        el1.className='right__main__body__question';
        
        questions.appendChild(el1);
        let tmp=''

        var promises = [];
        promises.push(firebase.database().ref('/'+g+'/'+lst_questions[n]+'/question').once('value'));
        promises.push(firebase.database().ref('/'+g+'/'+lst_questions[n]+'/options').once('value'));

        // Wait for all promises to resolve
        Promise.all(promises).then(function(snaps) {        
            // res[0] is your experience_id snapshot
            var question=snaps[0].val();
            var options=snaps[1].val();
            questions[n]=[question,options]; //Luu lai object nay
            tmp="<p>"+question+"</p><ul id=opts"+n+">";                                
            for (let i=0; i<options.length;i++){
                tmp=tmp+"<li><input type='checkbox' id='q"+n+"_"+i+ "' name='"+n+"' onclick='check_status("+n+")' value='"+i+"'><label for='q"+n+"_"+i+"'>"+options[i]+'</label></li>';
            }
            tmp=tmp+'</ul>';            
            document.getElementById('q'+n).innerHTML=tmp;
        });
        console.log('cache=',cache,'current=',current,'back_q',back_q,'next_q',next_q);
    }
    //Hide tất cả các cái còn lại

    let prev_q=document.getElementById('q'+cache);
    if (prev_q!=null && cache!=n){
        prev_q.style.display='none';
    }
    //Lưu cache
    cache=n;


}


function post_exam(){

}

function get_question(n,g){
    var promises = [];
    promises.push(firebase.database().ref('/'+g+'/'+lst_questions[n]+'/question').once('value'));
    promises.push(firebase.database().ref('/'+g+'/'+lst_questions[n]+'/options').once('value'));
    // Wait for all promises to resolve
    return Promise.all(promises).then(function(snaps) {        
        // res[0] is your experience_id snapshot
        var question=snaps[0].val();
        var options=snaps[1].val();
        return [question,options];
        })
}

function getAllQuestions(){
    let info=JSON.parse(localStorage.getItem('info'));    
    let g;
    if (info!=null){
        g=info['exam'];
    }
    else{
        let g=get_info()['exam'];//tương ứng với info['exam'];
    }

    //Nếu mà null thì lấy từ bộ nhớ web
    if(lst_questions==null){
        lst_questions=JSON.parse(localStorage.getItem('q'));   
    }

    let questions={};
    let tmp;
    var promises = [];
        for (let n=0;n<lst_questions.length;n++){ //Tao n*2 promise cho cac du lieu
            promises.push(firebase.database().ref('/'+g+'/'+lst_questions[n]+'/question').once('value'));
            promises.push(firebase.database().ref('/'+g+'/'+lst_questions[n]+'/options').once('value'));
        }

        // Wait for all promises to resolve
        return Promise.all(promises).then((snaps) => snaps.forEach((snap,i)=>{
                    if (i%2==0){
                        tmp=[]; //Khoi dau la rong []
                        tmp.push(snap.val()); //question
                    }
                    else if (i%2==1){//Den dong cuoi cung cua object thi ghi
                        tmp.push(snap.val()); //options
                        questions[(i-1)/2]=tmp; //Luu lai object nay
                        // console.log("in xong cau hoi ",(i-1)/2)
                    }                   
                    
                }))     
        .then(
            ()=>{
            // console.log("in ket qua questions: ",questions);
            localStorage.setItem('questions_bak',JSON.stringify(questions));
            return questions;
        })        
        
}

function saveExamInfo(sessionid,info,q,userAnswers){
    // A post examlog
    console.log("Bắt đầu gửi dữ liệu lên server");
    let url='https://ipinfo.io/json?token=';
    let userip;
    return fetch(url)
    // Extract JSON body content from HTTP response
        .then(response => response.json())
        // Do something with the JSON data
        .then(data => {
            userip=data;
            // Show a pop up if it works
            var examlog = {
                'sessionid': sessionid,
                'userinfo': info,
                'question_key':q ,
                'userAnswers':userAnswers,
                'ip':userip
            };
            // Get a key for a new Post.
            var newlogKey = firebase.database().ref().child('Examlogs').push().key;
            // Write the new post's data simultaneously in the posts list and the user's post list.
            var updates = {};
            updates['data'] = examlog;
            let date_time=new Date().toLocaleString("en-US", {timeZone: "Asia/Jakarta"})
            updates['time'] = JSON.stringify(date_time);
            return firebase.database().ref('/Examlogs/'+newlogKey).update(updates);
            }
        )

}

function get_solutions(){
    let info=JSON.parse(localStorage.getItem('info'));    
    let g;
    if (info!=null){
        g=info['exam'];
    }
    else{
        let g=get_info()['exam'];//tương ứng với info['exam'];
    }

    //Nếu mà null thì lấy từ bộ nhớ web
    if(lst_questions==null){
        lst_questions=JSON.parse(localStorage.getItem('q'));   
    }
    
    
    let solutions={};
    let p_arr=[];
    
    for (k of lst_questions){
        p_arr.push(firebase.database().ref('/'+g+'/'+k+'/answer').once('value'));
        // console.log('getsolution: đường dẫn:','/'+g+'/'+k+'/answer')
    }

    return Promise.all(p_arr).then(
        (snaps)=>snaps.forEach((snap,i)=>{
        solutions[i]=snap.val();
        // console.log('getsolutions: Câu hỏi ',i + ' tương ứng với câu trên database:' + lst_questions[i],"là ",solutions[i]);
    })).then(
        ()=>{
        // console.log("Getsolutions: Các đáp án ",solutions);
        return solutions;
        }        
    )
}


function check_res(){
    let res=show_progress(); //Tất cả các N câu trả lời của thí sinh
    let info=JSON.parse(localStorage.getItem('info'));    
    let g;
    if (info!=null){
        g=info['exam'];
    }
    else{
        let g=get_info()['exam'];//tương ứng với info['exam'];
    }

    console.log("check_res: ket qua show_progress",res)
    // let select_el=document.getElementById('exam');
    // let g=select_el.options[select_el.selectedIndex].value;
    let N=lst_questions.length;
    let res2={}; //Đúng thì ghi True, còn sai thì ghi câu hỏi Đúng
    let w_res={} //Chứa các câu trả lời bị sai
    ps=[];
    //Tạo các promises array
    return get_solutions().then(
        (answers)=>{
            Object.keys(answers).forEach(
                (key)=>{
                    if(answers[key]==res[key]){
                        res2[key]=true;
                    }
                    else{
                        res2[key]=answers[key];
                    }

                }
            )
            console.log("Kết quả chạy checkres: ", res2);    
            return res2; 
        }
    )
        
}


var j, jj;
var left_active;
var right_active;


document.addEventListener("keydown", function(event) {
    // console.log("Đã bắt được keydown của left_panel")
    var lnk_quets=document.querySelectorAll('#left_main_body ul li a');
    let N=parseInt(localStorage.getItem('N'));//lst_questions.length;

    // console.log(event.which);
    // console.log(event.keyCode);

    if(event.keyCode=='13'){
        // console.log("Enter");
        let el=document.activeElement
        if (el != null){
            document.activeElement.click();
        }
        
    }  
    else if (event.keyCode == '38') {
        // up arrow
        // console.log("Up");
        if (left_active==true){
            current=current-1<0?N-1:current-1;
            
        }
        else if (right_active==true)
        {
            jj--;
        }
        
    }
    else if (event.keyCode == '40') {
        // down arrow
        // console.log("Down");
        if (left_active==true){
            current=current+1>N-1?0:current+1;
        }
        else if (right_active==true)
        {
            jj++;
        }
        
    }
    else if (event.keyCode == '37') {
       // left arrow
    //    console.log("Left");
       left_active=true;
       right_active=false;
       
       document.getElementById('left_main_body').style.opacity=0.9;  
       document.getElementById('right_main_body').style.opacity=1; 
       
       jj=0; //Có dòng này để lúc nào nó từ trái qua là về 0 - đầu các lựa chọn

    }
    else if (event.keyCode == '39') {
       // right arrow
    //    console.log("Right");
       left_active=false;
       right_active=true; 
       
       document.getElementById('right_main_body').style.opacity=0.9; 
       document.getElementById('left_main_body').style.opacity=1;  

     }

    if (left_active==true){
        // console.log("Đang active left");        
        back_q=current-1;
        back_q=current-1<0?N-1:current-1;

        next_q=current+1;
        next_q=current+1>N-1?0:current+1;
        //bên trái đang kích hoạt j chạy từ 0 đến 59
        let el=lnk_quets[current];
        el.focus();
        el.click();

    }
    else if (right_active==true){
        //Đếm số lượng bên phải theo vị trí j
        // console.log("Đang active right");    
        let selector='#right_main_body #q'+current+' ul li input'
        var opts=document.querySelectorAll(selector);
        let no_jj=opts.length;

        //bên phải đang kích hoạt j chạy từ 0 đến cuối cùng
        jj=jj<0?no_jj-1:jj;
        jj=jj>no_jj-1?0:jj;

        let el=opts[jj];
        el.focus();
    }
    

})



function create_sessionid(){
    const exam_select=document.getElementById('exam');
    let exam=exam_select.options[exam_select.selectedIndex].value;//trả về DD PT hoặc CN
    let candidate_id=document.getElementById('id').value;
    let d=Date.now(); //trả về khoảng thời gian hiện tại trờ đi mốc đầu tiên năm 1970
    return exam+candidate_id+d.toString();
}

// 10.5.2021 Thay đổi kích cỡ fontszie
var no_rem=1.8;
const fontincrease=document.getElementById('font_increase');
fontincrease.addEventListener('click',
()=>{
    console.log("Đã thay đổi kích thước font tăng lên");
    no_rem=no_rem+0.2>3?3:no_rem+0.2;
    document.getElementById('right_main_body').style.fontSize =no_rem+"rem";
    document.getElementById('right_main_body').style.lineHeight =(no_rem*1.6)+"rem";
    document.getElementById('left_main_body').style.fontSize =no_rem+"rem";
    document.getElementById('left_main_body').style.lineHeight =(no_rem*1.6)+"rem";
})

const fontdecrease=document.getElementById('font_decrease');
fontdecrease.addEventListener('click',
()=>{
    console.log("Đã thay đổi kích thước font giảm xuống");
    no_rem=no_rem-0.2>1?no_rem-0.2:1;
    document.getElementById('right_main_body').style.fontSize =no_rem+"rem";
    document.getElementById('right_main_body').style.lineHeight =(no_rem*1.6)+"rem";
    document.getElementById('left_main_body').style.fontSize =no_rem+"rem";
    document.getElementById('left_main_body').style.lineHeight =(no_rem*1.6)+"rem";
})