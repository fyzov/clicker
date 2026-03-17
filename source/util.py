class Utils:
    @staticmethod
    def format_score(score: int) -> str:
        if score >= 1_000_000_000_000:
            return f"{score / 1_000_000_000_000:.1f}T"
        elif score >= 1_000_000_000:
            return f"{score / 1_000_000_000:.1f}B"
        elif score >= 1_000_000:
            return f"{score / 1_000_000:.1f}M"
        elif score >= 1_000:
            return f"{score / 1_000:.1f}K"
        else:
            return str(score)
