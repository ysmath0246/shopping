import React, { useEffect, useState } from "react"
import {
  collection,
  onSnapshot,
  addDoc,
  setDoc,
  doc,
  deleteDoc,
} from "firebase/firestore"
import { db } from "./firebase"

export default function PointShopTab() {
  const [items, setItems] = useState([])
  const [logs, setLogs] = useState([])
  const [students, setStudents] = useState([])

  const [selectedTab, setSelectedTab] = useState("items")     // 상품 / 사용내역
  const [selectedItem, setSelectedItem] = useState(null)      // 인증 모달용
  const [modalOpen, setModalOpen] = useState(false)
  const [authCode, setAuthCode] = useState("")
  const [verifiedStudent, setVerifiedStudent] = useState(null)

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteTargetLog, setDeleteTargetLog] = useState(null)
  const [deletePassword, setDeletePassword] = useState("")

  // Firebase 구독
  useEffect(() => {
    const u1 = onSnapshot(
      collection(db, "point_shop"),
      (snap) => setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
    const u2 = onSnapshot(
      collection(db, "point_logs"),
      (snap) => setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
    const u3 = onSnapshot(
      collection(db, "students"),
      (snap) => setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
    return () => { u1(); u2(); u3() }
  }, [])

  // 사용 인증
  const handleConfirmUse = async () => {
    const student = students.find(s => {
      const b = (s.birth||"").slice(-4)
      const p = (s.parentPhone||"").slice(-4)
      return b+p === authCode
    })
    if (!student) {
      alert("학생 인증 실패")
      return
    }
    if ((student.availablePoints||0) < selectedItem.point) {
      alert("포인트 부족")
      return
    }
    if (!window.confirm(`${selectedItem.point}pt 사용할까요?`)) return

    // 로그 추가
    await addDoc(collection(db, "point_logs"), {
      studentId: student.id,
      name: student.name,
      item: selectedItem.name,
      point: selectedItem.point,
      date: new Date().toISOString().split("T")[0],
    })
    // 포인트 차감
    await setDoc(
      doc(db, "students", student.id),
      { availablePoints: (student.availablePoints||0) - selectedItem.point },
      { merge: true }
    )
    setModalOpen(false)
    setVerifiedStudent(student)
    setTimeout(() => setVerifiedStudent(null), 5000)
  }

  // 로그 삭제
  const handleDeleteLog = (log) => {
    setDeleteTargetLog(log)
    setDeletePassword("")
    setDeleteModalOpen(true)
  }
  const confirmDeleteLog = async () => {
    if (deletePassword !== "ys0246") {
      alert("비밀번호 틀림")
      return
    }
    const student = students.find(s => s.id === deleteTargetLog.studentId)
    if (!student) return
    // 로그 지우고 포인트 복원
    await deleteDoc(doc(db, "point_logs", deleteTargetLog.id))
    await setDoc(
      doc(db, "students", student.id),
      { availablePoints: (student.availablePoints||0) + deleteTargetLog.point },
      { merge: true }
    )
    setDeleteModalOpen(false)
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* 대제목 */}
      <h1 className="text-4xl font-extrabold text-center text-blue-600">
        🎁 포인트 상점
      </h1>

      {/* 탭 버튼 */}
      <div className="flex justify-center space-x-4 mb-4">
        <button
          onClick={() => setSelectedTab("items")}
          className={`px-4 py-2 font-medium ${
            selectedTab==="items"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 hover:text-blue-600"
          }`}
        >
          상품
        </button>
        <button
          onClick={() => setSelectedTab("logs")}
          className={`px-4 py-2 font-medium ${
            selectedTab==="logs"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 hover:text-blue-600"
          }`}
        >
          사용 내역
        </button>
      </div>

      {/* 상품 그리드 */}
      {selectedTab === "items" && (
        <div className="grid grid-cols-4 gap-6">
          {items
            .sort((a,b)=>a.point-b.point)
            .map(item => (
              <div
                key={item.id}
                className="border border-gray-200 rounded-lg p-4 shadow hover:shadow-md bg-white flex flex-col"
              >
                <h2 className="font-semibold mb-2">{item.name}</h2>
                <div className="text-sm text-gray-500 mb-4">{item.point}pt</div>
                <button
                  onClick={()=>{ setSelectedItem(item); setModalOpen(true) }}
                  className="mt-auto bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition"
                >
                  사용하기
                </button>
              </div>
          ))}
        </div>
      )}

      {/* 사용 내역 리스트 */}
      {selectedTab === "logs" && (
        <div className="bg-white border border-gray-200 rounded-lg shadow p-6 space-y-3">
          {logs.map(log => (
            <div
              key={log.id}
              className="flex justify-between items-center bg-gray-50 rounded p-3 hover:bg-gray-100"
            >
              <div>
                <div className="font-medium">{log.name}</div>
                <div className="text-sm text-gray-600">
                  {log.item} · {log.point}pt
                </div>
                <div className="text-xs text-gray-400">{log.date}</div>
              </div>
              <button
                onClick={()=>handleDeleteLog(log)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                삭제
              </button>
            </div>
          ))}
        </div>
      )}

      {/* -- 여기에 아래로 “인증 모달” JSX 붙여넣으시면 완벽 복제됩니다 -- */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full space-y-4">
            <h2 className="text-xl font-semibold">학생 인증</h2>
            <p className="text-sm text-gray-600">생일4자리+엄마번호4자리</p>
            <input
              type="text"
              value={authCode}
              onChange={e=>setAuthCode(e.target.value)}
              className="w-full border rounded p-2"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={()=>setModalOpen(false)}
                className="px-4 py-2 rounded border"
              >
                취소
              </button>
              <button
                onClick={handleConfirmUse}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                확인
              </button>
            </div>
            {verifiedStudent && (
              <div className="mt-2 text-green-600">
                {verifiedStudent.name}님 사용 완료!
              </div>
            )}
          </div>
        </div>
      )}

      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full space-y-4">
            <h2 className="text-xl font-semibold">로그 삭제</h2>
            <p className="text-sm text-gray-600">관리자 비밀번호 입력</p>
            <input
              type="password"
              value={deletePassword}
              onChange={e=>setDeletePassword(e.target.value)}
              className="w-full border rounded p-2"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={()=>setDeleteModalOpen(false)}
                className="px-4 py-2 rounded border"
              >
                취소
              </button>
              <button
                onClick={confirmDeleteLog}
                className="px-4 py-2 bg-red-500 text-white rounded"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
