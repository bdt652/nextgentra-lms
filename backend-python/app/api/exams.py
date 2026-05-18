"""Exam Library API — CRUD for exams and their questions."""

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.database import Prisma, get_prisma
from app.dependencies.auth import CurrentUser, require_permission
from app.schemas.category import CategorySummary
from app.schemas.exam import (
    ExamCreate,
    ExamDetailResponse,
    ExamResponse,
    ExamUpdate,
    QuestionCreate,
    QuestionReorderRequest,
    QuestionResponse,
    QuestionUpdate,
)
from prisma.enums import QuestionType
from prisma.types import ExamInclude, ExamUpdateInput, ExamWhereInput, QuestionUpdateInput

router = APIRouter(prefix="/exams", tags=["exams"])

ExamReader = Annotated[CurrentUser, Depends(require_permission("exam:read"))]
ExamCreator = Annotated[CurrentUser, Depends(require_permission("exam:create"))]
ExamEditor = Annotated[CurrentUser, Depends(require_permission("exam:update"))]
ExamDeleter = Annotated[CurrentUser, Depends(require_permission("exam:delete"))]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_EXAM_INCLUDE: ExamInclude = {"questions": True, "category": True}


def _build_category(cat: object) -> Optional[CategorySummary]:
    if cat is None:
        return None
    return CategorySummary(
        id=cat.id,  # type: ignore[attr-defined]
        name=cat.name,  # type: ignore[attr-defined]
        color=cat.color,  # type: ignore[attr-defined]
        icon=cat.icon,  # type: ignore[attr-defined]
    )


def _question_to_response(q: object) -> QuestionResponse:
    return QuestionResponse(
        id=q.id,  # type: ignore[attr-defined]
        exam_id=q.exam_id,  # type: ignore[attr-defined]
        content=q.content,  # type: ignore[attr-defined]
        type=q.type.value if hasattr(q.type, "value") else q.type,  # type: ignore[attr-defined]
        options=q.options,  # type: ignore[attr-defined]
        correct_answer=q.correct_answer,  # type: ignore[attr-defined]
        code_template=q.code_template,  # type: ignore[attr-defined]
        test_cases=q.test_cases,  # type: ignore[attr-defined]
        points=q.points,  # type: ignore[attr-defined]
        order=q.order,  # type: ignore[attr-defined]
    )


def _exam_to_response(e: object) -> ExamResponse:
    question_count = len(e.questions) if e.questions is not None else 0  # type: ignore[attr-defined]
    return ExamResponse(
        id=e.id,  # type: ignore[attr-defined]
        title=e.title,  # type: ignore[attr-defined]
        description=e.description,  # type: ignore[attr-defined]
        teacher_id=e.teacher_id,  # type: ignore[attr-defined]
        duration=e.duration,  # type: ignore[attr-defined]
        pass_score=e.pass_score,  # type: ignore[attr-defined]
        category_id=e.category_id,  # type: ignore[attr-defined]
        category=_build_category(e.category),  # type: ignore[attr-defined]
        created_at=e.created_at,  # type: ignore[attr-defined]
        updated_at=e.updated_at,  # type: ignore[attr-defined]
        question_count=question_count,
    )


def _require_owner(teacher_id: str, current_user_id: str) -> None:
    if teacher_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the exam owner can perform this action",
        )


# ---------------------------------------------------------------------------
# Exams
# ---------------------------------------------------------------------------


@router.get("", response_model=list[ExamResponse])
async def list_exams(
    current_user: ExamReader,
    prisma: Annotated[Prisma, Depends(get_prisma)],
    mine: bool = False,
    category_id: Optional[str] = None,
) -> list[ExamResponse]:
    where: ExamWhereInput = {}
    if mine:
        where["teacher_id"] = current_user.id
    if category_id:
        where["category_id"] = category_id
    exams = await prisma.exam.find_many(
        where=where,
        include=_EXAM_INCLUDE,
        order={"created_at": "desc"},
    )
    return [_exam_to_response(e) for e in exams]


@router.post("", response_model=ExamResponse, status_code=status.HTTP_201_CREATED)
async def create_exam(
    data: ExamCreate,
    current_user: ExamCreator,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> ExamResponse:
    exam = await prisma.exam.create(
        data={
            "title": data.title,
            "description": data.description,
            "teacher_id": current_user.id,
            "duration": data.duration,
            "pass_score": data.pass_score,
            "category_id": data.category_id,
        },
        include=_EXAM_INCLUDE,
    )
    return _exam_to_response(exam)


@router.get("/{exam_id}", response_model=ExamDetailResponse)
async def get_exam(
    exam_id: str,
    _: ExamReader,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> ExamDetailResponse:
    exam = await prisma.exam.find_unique(
        where={"id": exam_id},
        include={"questions": {"order_by": {"order": "asc"}}, "category": True},
    )
    if not exam:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found")

    questions = [_question_to_response(q) for q in (exam.questions or [])]
    return ExamDetailResponse(
        id=exam.id,
        title=exam.title,
        description=exam.description,
        teacher_id=exam.teacher_id,
        duration=exam.duration,
        pass_score=exam.pass_score,
        category_id=exam.category_id,
        category=_build_category(exam.category),
        created_at=exam.created_at,
        updated_at=exam.updated_at,
        question_count=len(questions),
        questions=questions,
    )


@router.patch("/{exam_id}", response_model=ExamResponse)
async def update_exam(
    exam_id: str,
    data: ExamUpdate,
    current_user: ExamEditor,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> ExamResponse:
    exam = await prisma.exam.find_unique(where={"id": exam_id})
    if not exam:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found")
    _require_owner(exam.teacher_id, current_user.id)

    update_data: ExamUpdateInput = {}
    if data.title is not None:
        update_data["title"] = data.title
    if data.description is not None:
        update_data["description"] = data.description
    if data.duration is not None:
        update_data["duration"] = data.duration
    if data.pass_score is not None:
        update_data["pass_score"] = data.pass_score
    if data.category_id is not None:
        update_data["category"] = {"connect": {"id": data.category_id}}

    updated = await prisma.exam.update(
        where={"id": exam_id},
        data=update_data,
        include=_EXAM_INCLUDE,
    )
    return _exam_to_response(updated)


@router.delete("/{exam_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_exam(
    exam_id: str,
    current_user: ExamDeleter,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> None:
    exam = await prisma.exam.find_unique(where={"id": exam_id})
    if not exam:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found")
    _require_owner(exam.teacher_id, current_user.id)
    await prisma.exam.delete(where={"id": exam_id})


# ---------------------------------------------------------------------------
# Questions
# ---------------------------------------------------------------------------


@router.post(
    "/{exam_id}/questions",
    response_model=QuestionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_question(
    exam_id: str,
    data: QuestionCreate,
    current_user: ExamEditor,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> QuestionResponse:
    exam = await prisma.exam.find_unique(where={"id": exam_id})
    if not exam:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found")
    _require_owner(exam.teacher_id, current_user.id)

    if data.order is None:
        count = await prisma.question.count(where={"exam_id": exam_id})
        order = count
    else:
        order = data.order

    question = await prisma.question.create(
        data={
            "exam_id": exam_id,
            "content": data.content,
            "type": QuestionType(data.type),
            "options": data.options,
            "correct_answer": data.correct_answer,
            "code_template": data.code_template,
            "test_cases": data.test_cases,
            "points": data.points if data.points is not None else 1.0,
            "order": order,
        }
    )
    return _question_to_response(question)


@router.patch("/{exam_id}/questions/{question_id}", response_model=QuestionResponse)
async def update_question(
    exam_id: str,
    question_id: str,
    data: QuestionUpdate,
    current_user: ExamEditor,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> QuestionResponse:
    question = await prisma.question.find_unique(where={"id": question_id})
    if not question or question.exam_id != exam_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    exam = await prisma.exam.find_unique(where={"id": exam_id})
    if exam:
        _require_owner(exam.teacher_id, current_user.id)

    update_data: QuestionUpdateInput = {}
    if data.content is not None:
        update_data["content"] = data.content
    if data.type is not None:
        update_data["type"] = QuestionType(data.type)
    if data.options is not None:
        update_data["options"] = data.options
    if data.correct_answer is not None:
        update_data["correct_answer"] = data.correct_answer
    if data.code_template is not None:
        update_data["code_template"] = data.code_template
    if data.test_cases is not None:
        update_data["test_cases"] = data.test_cases
    if data.points is not None:
        update_data["points"] = data.points
    if data.order is not None:
        update_data["order"] = data.order

    updated = await prisma.question.update(
        where={"id": question_id},
        data=update_data,
    )
    return _question_to_response(updated)


@router.delete("/{exam_id}/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_question(
    exam_id: str,
    question_id: str,
    current_user: ExamEditor,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> None:
    question = await prisma.question.find_unique(where={"id": question_id})
    if not question or question.exam_id != exam_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")
    exam = await prisma.exam.find_unique(where={"id": exam_id})
    if exam:
        _require_owner(exam.teacher_id, current_user.id)
    await prisma.question.delete(where={"id": question_id})


@router.post("/{exam_id}/questions/reorder", response_model=list[QuestionResponse])
async def reorder_questions(
    exam_id: str,
    data: QuestionReorderRequest,
    current_user: ExamEditor,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> list[QuestionResponse]:
    exam = await prisma.exam.find_unique(where={"id": exam_id})
    if not exam:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found")
    _require_owner(exam.teacher_id, current_user.id)

    for item in data.items:
        await prisma.question.update(
            where={"id": item.id},
            data={"order": item.order},
        )

    questions = await prisma.question.find_many(
        where={"exam_id": exam_id},
        order={"order": "asc"},
    )
    return [_question_to_response(q) for q in questions]
