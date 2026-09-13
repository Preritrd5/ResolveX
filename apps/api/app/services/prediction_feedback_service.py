"""
ResolveX Prediction Feedback Tracking & Model Versioning
Evaluates prediction efficacy when post-incident ground truth arrives.
Explicitly safeguards against premature accuracy claims when evaluated outcomes are absent.
"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timezone

from apps.api.app.domain.schemas import PredictionFeedbackMetricsSchema
from apps.api.app.services.prediction_engine import prediction_engine
from apps.api.app.services.proactive_service import proactive_service
from apps.api.app.services.incident_service import PRIMARY_INCIDENT_ID

class PredictionFeedbackService:
    """
    Maintains prediction outcome feedback records, model version metadata,
    and precision/recall metrics based strictly on evaluated ground truth.
    """
    def __init__(self):
        self._outcomes: List[Dict[str, Any]] = []
        self.model_version_info = {
            "model_name": "incident_pattern_matcher",
            "model_version": "1.0",
            "feature_version": "1.0",
            "method": "rule_based_evidence_corroboration",
            "registered_at": "2026-09-13T00:00:00Z"
        }

    async def get_prediction_metrics(self) -> PredictionFeedbackMetricsSchema:
        """
        Returns prediction feedback metrics. If no ground-truth outcomes have been
        evaluated yet, explicitly returns status message and avoids fabricating accuracy.
        """
        preds = prediction_engine._prediction_cache.get(PRIMARY_INCIDENT_ID, [])
        if not preds:
            preds = await prediction_engine.predict_affected_customers(PRIMARY_INCIDENT_ID)

        confirmed_count = sum(1 for p in preds if p.classification == "CONFIRMED_AFFECTED")
        likely_count = sum(1 for p in preds if p.classification == "LIKELY_AFFECTED")

        recs = await proactive_service.list_proactive_queue()
        sent_count = sum(1 for r in recs if r.status == "SENT")

        # Ground truth evaluation check
        if len(self._outcomes) == 0:
            return PredictionFeedbackMetricsSchema(
                predictions_generated=len(preds),
                confirmed_predictions=confirmed_count,
                likely_predictions=likely_count,
                evaluated_predictions=0,
                precision=None,
                recall=None,
                false_positives=0,
                false_negatives=0,
                proactive_recommendations_count=len(recs),
                proactive_sent_count=sent_count,
                status_message="Not enough evaluated outcomes to calculate prediction accuracy."
            )

        # If evaluated ground truth outcomes exist:
        tp = sum(1 for o in self._outcomes if o.get("predicted") == o.get("actual") and o.get("actual") == "AFFECTED")
        fp = sum(1 for o in self._outcomes if o.get("predicted") == "AFFECTED" and o.get("actual") != "AFFECTED")
        fn = sum(1 for o in self._outcomes if o.get("predicted") != "AFFECTED" and o.get("actual") == "AFFECTED")

        precision = round(tp / (tp + fp), 2) if (tp + fp) > 0 else 1.0
        recall = round(tp / (tp + fn), 2) if (tp + fn) > 0 else 1.0

        return PredictionFeedbackMetricsSchema(
            predictions_generated=len(preds),
            confirmed_predictions=confirmed_count,
            likely_predictions=likely_count,
            evaluated_predictions=len(self._outcomes),
            precision=precision,
            recall=recall,
            false_positives=fp,
            false_negatives=fn,
            proactive_recommendations_count=len(recs),
            proactive_sent_count=sent_count,
            status_message=f"Calibrated on {len(self._outcomes)} post-incident verified customer outcomes."
        )

    def record_outcome(
        self,
        prediction_id: str,
        predicted_classification: str,
        actual_outcome: str,
        notes: str = ""
    ):
        """Records ground-truth outcome after customer contact or reconciliation"""
        self._outcomes.append({
            "prediction_id": prediction_id,
            "predicted": predicted_classification,
            "actual": actual_outcome,
            "notes": notes,
            "evaluated_at": datetime.now(timezone.utc).isoformat()
        })

prediction_feedback_service = PredictionFeedbackService()
